var myFullpage = new fullpage('#fullpage',{
    autoScrolling: true, // Se activa el scroll.
    fitToSection: false, // Acomoda el scroll automaticamente para que la seccion se muestre en pantalla.
    fitToSectionDelay: 300, // Delay antes de acomodar la seccion automaticamente.
    easing: 'easeInOutCubic', // Funcion de tiempo de la animacion.
    scrollingSpeed: 600, // Velocidad del scroll. Valores: en milisegundos.
    css3: true, // Si usara CSS3 o javascript.
    easingcss3: 'ease-out', // Curva de velocidad del efecto.
    loopBottom: true, //
    navigation: true, // Muesta la barra de navegación.
    /* Navigation bar */
    menu: '#menu', // Menu de navegación.
    anchors: ['home','about', 'research', 'projects', 'contact'], // Anclas, las usamos para identificar cada seccion y poder acceder a ellas con el menu.
    navigationTooltips: ['Home', 'About', 'Research', 'Projects', 'Contact me'], // Tooltips que mostrara por cada boton.
    showActiveTooltip: true, // Mostrar tooltip activa.
/* Sections */
    sectionsColor : ['#000', '#c2c2c2', '#000'], // Color de fondo de cada seccion.
    verticalCentered: true, // Si alineara de forma vertical los contenidos de cada seccion.
/* Slide */
    controlArrows: true, // Flechas del slide
    slidesNavigation: true, // Indicadores del slide
    afterLoad: function(origin, destination){
        if(destination.anchor == 'contacto'){
             document.querySelector('.footer h2').style.opacity = 1;
        }
   }
});

