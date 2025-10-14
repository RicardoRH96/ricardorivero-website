# Docker Tutorial — SLURM‑Compatible Workflows with Docker, Singularity, and R/Python

This tutorial demonstrates how to build a reproducible container for geospatial/scientific analysis, publish it to a registry, and run it on a SLURM‑managed HPC system using Singularity (SingularityCE). Examples cover both Python and R stacks and emphasize portability, determinism, and thread hygiene on shared nodes. All organization‑specific names and paths have been removed.

---

## 1. Why containers for HPC?

Containers bundle your runtime (OS libraries, compilers, interpreters) together with your application dependencies. On HPC, this avoids reconciling library versions or requesting administrator installs. The recommended pattern is:

1. Build locally with Docker.
2. Publish to a registry (e.g., Docker Hub).
3. Pull and run on the cluster with SingularityCE under SLURM.

This yields a single source of truth for your environment that is auditable and versioned.

---

## 2. Prerequisites

- Local machine with Docker installed.
- An account on a container registry (e.g., Docker Hub).
- HPC access with SingularityCE available (e.g., `module load singularity`).
- SLURM for scheduling (`sbatch`, `srun`, etc.).
- If your development machine is ARM (e.g., Apple Silicon), you must cross‑build for `linux/amd64` so the image runs on typical x86_64 HPC nodes.

---

## 3. Authoring the Dockerfile

Below are the major sections of a Dockerfile suitable for Python or R geospatial/scientific workloads. Adjust the packages to match your use case.

### 3.1 Base image selection

Python‑first:
```dockerfile
FROM python:3.12-slim
```

R‑first (binary CRAN via r2u):
```dockerfile
FROM rocker/r2u:4.4
```

**Notes**
- “Slim” images are small and require you to explicitly add only what you need.
- For predominantly R workflows, starting from a Rocker image reduces compilation friction.

### 3.2 Noninteractive APT

```dockerfile
ENV DEBIAN_FRONTEND=noninteractive
```

Prevents prompts that can block unattended builds.

### 3.3 System dependencies

Minimal core and geospatial/system SDKs (edit if not doing GIS):
```dockerfile
RUN apt-get update &&     apt-get install -y --no-install-recommends         libgomp1 ca-certificates         libgdal-dev gdal-bin libproj-dev proj-bin         libgeos-dev libspatialindex-dev         libexpat1 libexpat1-dev &&     rm -rf /var/lib/apt/lists/*
```

- `libgomp1` provides the OpenMP runtime (threads for BLAS/ML libs).
- GDAL/PROJ/GEOS are required for `sf`/`terra` in R and many Python GIS wheels/CLIs.

### 3.4 Python packages

```dockerfile
RUN python -m pip install --upgrade --no-cache-dir pip setuptools wheel
RUN pip install --no-cache-dir     numpy pandas pyarrow     shapely>=2 pyproj rtree     fiona rasterio geopandas     scikit-learn lightgbm xgboost scikit-optimize     joblib tqdm requests pyimpute matplotlib
```

Prefer wheels to avoid compilers at build time. Optionally pin exact versions via `requirements.txt`.

### 3.5 R packages (optional)

If using `rocker/r2u`, most CRAN packages are available as Debian binaries:
```dockerfile
RUN apt-get update &&     apt-get install -y --no-install-recommends         r-cran-data.table r-cran-dplyr r-cran-readr r-cran-ggplot2         r-cran-sf r-cran-terra r-cran-lwgeom r-cran-glue r-cran-pak         r-cran-renv &&     rm -rf /var/lib/apt/lists/*
```

Alternatively (generic R base), use `pak` or `install2.r` with the Posit Package Manager binary mirror for fast installs.

### 3.6 Threading and geospatial defaults

```dockerfile
ENV OMP_NUM_THREADS=2     OPENBLAS_NUM_THREADS=2     MKL_NUM_THREADS=2     NUMEXPR_NUM_THREADS=2     XGBOOST_NUM_THREADS=1     PROJ_NETWORK=OFF     GDAL_CACHEMAX=512
```

- Caps threads to prevent oversubscription on shared nodes.
- Disables PROJ network fetches for reproducibility.
- You can override these per‑job in SLURM (see §7).

### 3.7 Working directory

```dockerfile
WORKDIR /work
```

Mount project code/data here at runtime.

---

## 4. Building and testing locally

On your development machine:

```bash
export IMG=scientific-pipeline
export TAG=0.1.0
export REPO=<dockerhub_user>/$IMG

# one‑time: buildx builder
docker buildx create --use

# Cross‑build for HPC architecture (usually linux/amd64)
docker buildx build   --platform linux/amd64   -t $REPO:$TAG   -t $REPO:latest   --load .

# Quick sanity check
docker run --rm --platform linux/amd64 $REPO:$TAG   python -c "import geopandas; print('Environment OK')"
```

---

## 5. Publishing to Docker Hub

```bash
docker login                     # enter credentials
docker push $REPO:$TAG
docker push $REPO:latest
```

Optionally record the immutable digest:
```bash
docker buildx imagetools inspect $REPO:$TAG
```

---

## 6. Retrieving the image on the HPC with SingularityCE

On the login node:
```bash
module load singularity
export IMG=scientific-pipeline
export TAG=0.1.0
export REPO=<dockerhub_user>/$IMG

mkdir -p $PWD/.sif
singularity pull --dir $PWD/.sif docker://$REPO:$TAG
# => ./.sif/${IMG}_${TAG}.sif
```

Private repo:
```bash
export SINGULARITY_DOCKER_USERNAME=<dockerhub_user>
export SINGULARITY_DOCKER_PASSWORD=<access_token_or_password>
singularity pull --dir $PWD/.sif docker://$REPO:$TAG
```

Test:
```bash
singularity exec ./.sif/${IMG}_${TAG}.sif   python -c "import geopandas; print('Singularity OK')"
```

---

## 7. Running containers under SLURM

### 7.1 Thread hygiene via environment forwarding

Use `SINGULARITYENV_` prefixes so variables appear inside the container:

```bash
export SINGULARITYENV_OMP_NUM_THREADS=${SLURM_CPUS_PER_TASK:-2}
export SINGULARITYENV_OPENBLAS_NUM_THREADS=$SINGULARITYENV_OMP_NUM_THREADS
export SINGULARITYENV_MKL_NUM_THREADS=$SINGULARITYENV_OMP_NUM_THREADS
export SINGULARITYENV_NUMEXPR_NUM_THREADS=$SINGULARITYENV_OMP_NUM_THREADS
export SINGULARITYENV_XGBOOST_NUM_THREADS=$SINGULARITYENV_OMP_NUM_THREADS
export SINGULARITYENV_PROJ_NETWORK=OFF
export SINGULARITYENV_GDAL_CACHEMAX=1024
```

### 7.2 Batch script template (CPU)

```bash
#!/bin/bash -l
#SBATCH --job-name=analysis
#SBATCH --partition=compute
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=08:00:00
#SBATCH --output=logs/%x-%j.out
#SBATCH --error=logs/%x-%j.err

module purge
module load singularity

SIF=./.sif/scientific-pipeline_0.1.0.sif
PROJECT=/path/to/project         # contains src/process.py or script.R
INPUTS=/path/to/inputs
OUTPUTS=/path/to/outputs

# Forward thread/env settings into container
export SINGULARITYENV_OMP_NUM_THREADS=${SLURM_CPUS_PER_TASK}
export SINGULARITYENV_OPENBLAS_NUM_THREADS=${SINGULARITYENV_OMP_NUM_THREADS}
export SINGULARITYENV_MKL_NUM_THREADS=${SINGULARITYENV_OMP_NUM_THREADS}
export SINGULARITYENV_NUMEXPR_NUM_THREADS=${SINGULARITYENV_OMP_NUM_THREADS}
export SINGULARITYENV_XGBOOST_NUM_THREADS=${SINGULARITYENV_OMP_NUM_THREADS}
export SINGULARITYENV_PROJ_NETWORK=OFF
export SINGULARITYENV_GDAL_CACHEMAX=1024

# Execute
singularity exec --cleanenv   --bind "$PROJECT":/work/project,"$INPUTS":/work/inputs,"$OUTPUTS":/work/outputs   "$SIF"   bash -lc "python /work/project/src/process.py /work/inputs /work/outputs"
```

Replace the final command with `Rscript` if running an R pipeline.

### 7.3 Job arrays

```bash
N=$(find /path/to/inputs -maxdepth 1 -type f -name '*.geojson' | wc -l)
sbatch --array=0-$(($N-1))%16 run_container.sh
```

Inside your script, use `${SLURM_ARRAY_TASK_ID}` to index the input list.

---

## 8. Reproducibility and provenance

- **Pin versions**: use `requirements.txt` (Python) and `renv.lock` (R). Restore during the Docker build for deterministic environments.
- **Record digests**: store the image digest (sha256) alongside job outputs.
- **Log runtime env**: at job start, write `sessionInfo()` (R) or `pip freeze` (Python), and for geospatial stacks record `gdalinfo --version` and (in R) `sf::sf_extSoftVersion()`.
- **Architecture awareness**: always build for `linux/amd64` unless your HPC documents otherwise.

---

## 9. Common pitfalls (and remedies)

- **Oversubscription**: set thread envs (above) based on `--cpus-per-task`.
- **Mixed GDAL/PROJ builds**: Python wheels may bundle GDAL; CLIs use system GDAL. Be consistent; test both at build/test time.
- **Private registries**: authenticate via `SINGULARITY_DOCKER_USERNAME/PASSWORD` before `singularity pull`.
- **Network‑restricted nodes**: pull on the login node and reference the local `.sif` in jobs.
- **Permissions**: Singularity runs as your user by default; prefer writing to scratch/project directories you own.

---

## 10. Minimal end‑to‑end checklist

1. Write `Dockerfile` with required system + language packages.
2. `docker buildx build --platform linux/amd64 -t <repo>:<tag> --load .`
3. `docker push <repo>:<tag>`
4. On HPC: `singularity pull .sif docker://<repo>:<tag>`
5. Submit SLURM job that binds project paths and forwards thread envs.

This pattern is robust across diverse clusters and workflows. Tailor the package lists and SLURM directives to your project’s needs.
