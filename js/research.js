document.addEventListener('DOMContentLoaded', function () {
  const publications = window.PUBLICATIONS || [];
  const list = document.querySelector('[data-publication-list]');
  const pdfTitle = document.querySelector('[data-pdf-title]');
  const pdfStatus = document.querySelector('[data-pdf-status]');
  const pdfFrame = document.querySelector('[data-pdf-frame]');
  const defaultPublication = publications.find(function (publication) {
    return publication.defaultShow;
  });

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function showPdf(publication) {
    if (!pdfTitle || !pdfStatus || !pdfFrame) {
      return;
    }

    pdfTitle.textContent = publication.title;
    pdfStatus.textContent = publication.venue + ' · ' + publication.year;
    pdfFrame.innerHTML = '';

    const object = document.createElement('object');
    object.type = 'application/pdf';
    object.data = publication.pdf;
    object.setAttribute('aria-label', 'PDF viewer for ' + publication.title);

    const fallback = createElement('div', 'pdf-placeholder');
    fallback.innerHTML = '<p>Your browser did not open the embedded manuscript. Use the DOI link beside the publication.</p>';
    object.appendChild(fallback);
    pdfFrame.appendChild(object);
  }

  function renderPublication(publication) {
    const card = createElement('article', publication.highlight ? 'research-card is-highlight' : 'research-card');
    card.id = publication.id;

    const meta = createElement('p', 'research-meta', publication.venue + ' · ' + publication.year);
    const title = createElement('h2', null, publication.title);
    const citation = createElement('p', null, publication.citation);
    const role = createElement('p', null, publication.role);
    const summary = createElement('p', null, publication.summary);

    const tags = createElement('ul', 'research-tags');
    publication.tags.forEach(function (tag) {
      tags.appendChild(createElement('li', null, tag));
    });

    const links = createElement('ul', 'publication-links');

    if (publication.pdf) {
      const pdfItem = document.createElement('li');
      const pdfButton = document.createElement('button');
      pdfButton.type = 'button';
      pdfButton.textContent = 'Read manuscript';
      pdfButton.className = 'primary-action';
      pdfButton.addEventListener('click', function () {
        showPdf(publication);
      });
      pdfItem.appendChild(pdfButton);
      links.appendChild(pdfItem);
    }

    [
      ['DOI', publication.doi],
      ['Journal', publication.article],
      ['Overview', publication.overview]
    ].forEach(function (linkData) {
      if (!linkData[1]) {
        return;
      }
      const item = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = linkData[1];
      anchor.textContent = linkData[0];
      if (/^https?:\/\//.test(linkData[1])) {
        anchor.target = '_blank';
        anchor.rel = 'noopener';
      }
      item.appendChild(anchor);
      links.appendChild(item);
    });

    card.append(meta, title, citation, role, summary, tags, links);

    return card;
  }

  if (list) {
    const highlights = publications.filter(function (publication) {
      return publication.highlight;
    });
    const additional = publications.filter(function (publication) {
      return !publication.highlight;
    });

    [
      ['Research highlights', highlights],
      ['Additional publications', additional]
    ].forEach(function (group) {
      if (!group[1].length) {
        return;
      }

      const section = createElement('div', 'publication-section');
      section.appendChild(createElement('h2', 'publication-section-title', group[0]));
      const grid = createElement('div', 'publication-card-stack');
      group[1].forEach(function (publication) {
        grid.appendChild(renderPublication(publication));
      });
      section.appendChild(grid);
      list.appendChild(section);
    });

    const initialPublication = defaultPublication || publications.find(function (publication) {
      return publication.pdf;
    });
    if (initialPublication) {
      showPdf(initialPublication);
    }
  }
});
