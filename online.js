(function(){var el=document.getElementById('cal-embed');if(!el)return;var done=false;
function load(){if(done)return;done=true;var u=el.getAttribute('data-url');el.innerHTML='<div class="calendly-inline-widget" data-url="'+u+'"></div>';
var s=document.createElement('script');s.src='https://assets.calendly.com/assets/external/widget.js';s.async=true;document.body.appendChild(s);}
if('IntersectionObserver' in window){new IntersectionObserver(function(e,o){if(e[0].isIntersecting){load();o.disconnect();}},{rootMargin:'300px'}).observe(el);}else{load();}
})();
