(this.webpackJsonpAventurasEn360=this.webpackJsonpAventurasEn360||[]).push([[0],{18:function(a,e,o){a.exports=o(32)},23:function(a,e,o){},24:function(a,e,o){},25:function(a,e,o){},31:function(a,e,o){},32:function(a,e,o){"use strict";o.r(e);var r=o(0),t=o.n(r),n=o(16),s=o.n(n),c=o(11),i=o(1),u=o(9),l=(o(23),function(a){var e=a.style;return t.a.createElement("header",{style:e},t.a.createElement("h1",null,"Aventuras en 360\xba"),t.a.createElement("div",null,t.a.createElement("a",{target:"_blank",rel:"noopener noreferrer",href:"https://github.com/DenkSchuldt"},t.a.createElement("i",{className:"fab fa-github"})),t.a.createElement("a",{target:"_blank",rel:"noopener noreferrer",href:"https://twitter.com/DenkSchuldt"},t.a.createElement("i",{className:"fab fa-twitter"})),t.a.createElement("a",{target:"_blank",rel:"noopener noreferrer",href:"https://www.instagram.com/denkschuldt/"},t.a.createElement("i",{className:"fab fa-instagram"}))))}),g=(o(24),function(a){a.id;var e=a.idx,o=a.total,n=a.src,s=a.name,c=a.marker,i=a.location,l=a.setCurrentIndex,g=Object(r.useState)(),m=Object(u.a)(g,2),d=m[0],p=m[1],h=Object(r.useState)(""),E=Object(u.a)(h,2),y=E[0],b=E[1];return Object(r.useEffect)((function(){b(e+1);var a,o=new window.PANOLENS.ImagePanorama("".concat(window.location.origin,"/360/images/").concat(n));d?a=d:((a=new window.PANOLENS.Viewer({container:document.getElementById("myVwr"),cameraFov:65,autoRotate:!0,autoRotateSpeed:1,autoRotateActivationDuration:1e4,controlButtons:["fullscreen","setting"]})).getCamera().translateX(500),a.getCamera().translateY(-100),p(a)),a.clearAllCache(),a.add(o),a.setPanorama(o)}),[e]),t.a.createElement("div",{className:"my-vwr-wrapper"},t.a.createElement("div",{className:"my-vwr-header"},t.a.createElement("span",{className:"index"},t.a.createElement("input",{type:"number",value:y,onKeyDown:function(a){if("Enter"===a.key){var e=parseInt(y);e>=1&&e<=o&&l(e-1)}},size:"".concat(y).length,onChange:function(a){return b(a.target.value)}}),"/".concat(o)),t.a.createElement("div",{className:"content"},t.a.createElement("strong",null,s),t.a.createElement("div",null,i))),t.a.createElement("div",{id:"myVwr",className:"my-vwr"},c&&t.a.createElement("a",{href:c,target:"_blank",className:"my-vwr-marker",rel:"noopener noreferrer"},t.a.createElement("i",{class:"fas fa-map-marked-alt"}))),t.a.createElement("div",{className:"my-vwr-footer"},t.a.createElement("div",{className:"fb-share-button","data-href":"https://360.dennyschuldt.com","data-layout":"button","data-size":"small"},t.a.createElement("a",{target:"_blank",href:"https://www.facebook.com/sharer/sharer.php?u=".concat(window.location.href,"src=sdkpreparse"),className:"fb-xfbml-parse-ignore"},"Share")),t.a.createElement("a",{target:"_blank",rel:"noopener noreferrer",className:"twitter-share-button",href:"".concat(escape("https://twitter.com/intent/tweet?text="+window.location.href))},"Tweet"),t.a.createElement("a",{target:"_blank",rel:"noopener noreferrer",className:"github-button",href:"https://github.com/denkschuldt/360","data-color-scheme":"no-preference: dark; light: dark; dark: dark;","aria-label":"Star denkschuldt/360 on GitHub"},"Star")))}),m=o(6),d=(o(25),function(){var a=Object(i.g)(),e=Object(r.useState)((function(){var e=new URLSearchParams(a.location.search).get("id")||localStorage.getItem("my-id"),o=m.findIndex((function(a){return a.id==e}));return o>=0?o:0})),o=Object(u.a)(e,2),n=o[0],s=o[1],c=function(a){var e;s(a),localStorage.setItem("my-id",null===(e=m[a])||void 0===e?void 0:e.id)},d=n>0,p=n<m.length-1;return t.a.createElement(t.a.Fragment,null,t.a.createElement(l,null),t.a.createElement("main",null,t.a.createElement("button",{onClick:function(){if(d){var e=m[n-1];a.replace("?id=".concat(e.id)),c(n-1)}},style:d?{}:{visibility:"hidden"},className:"my-btn-left"},t.a.createElement("i",{className:"fas fa-arrow-circle-left"})),t.a.createElement(g,Object.assign({idx:n,total:m.length},m[n],{setCurrentIndex:c})),t.a.createElement("button",{onClick:function(){if(p){var e=m[n+1];a.replace("?id=".concat(e.id)),c(n+1)}},style:p?{}:{visibility:"hidden"},className:"my-btn-right"},t.a.createElement("i",{className:"fas fa-arrow-circle-right"}))))});o(31);document.addEventListener("DOMContentLoaded",(function(){s.a.render(t.a.createElement(t.a.StrictMode,null,t.a.createElement(c.a,null,t.a.createElement(i.d,null,t.a.createElement(i.b,{path:"/"},t.a.createElement(d,null)),t.a.createElement(i.b,null,t.a.createElement(i.a,{to:"/"}))))),document.getElementById("AventurasEn360"))}))},6:function(a){a.exports=JSON.parse('[{"id":1595694311865,"src":"Chimborazo/004.jpg","name":"Alaus\xed","location":"Alaus\xed. Provincia de Chimborazo, Ecuador","marker":"https://goo.gl/maps/HKQ1bxJnX3ETuiSQ6","tags":["Chimborazo","Ecuador"]},{"id":1595694311864,"src":"Chimborazo/005.jpg","name":"Nariz del Diablo","location":"Alaus\xed. Provincia de Chimborazo, Ecuador","marker":"https://goo.gl/maps/92wEptJFxY1hwSkj7","tags":["Chimborazo","Ecuador"]},{"id":1595694311863,"src":"Chimborazo/003.jpg","name":"Cascada Panam\xe1","location":"Huigra. Provincia de Chimborazo, Ecuador","marker":"https://goo.gl/maps/s5ReUnySLv4HsNyx7","tags":["Chimborazo","Ecuador"]},{"id":1595694311862,"src":"BuenosAires/001.jpg","name":"Obelisco","location":"Av. 9 de Julio. Buenos Aires, Argentina","marker":"https://goo.gl/maps/2NMR4ierS6VwfukcA","tags":["Buenos Aires","Argentina"]},{"id":1595694311861,"src":"BuenosAires/003.jpg","name":"Casa Rosada","location":"Buenos Aires, Argentina","marker":"https://goo.gl/maps/rxJK6xNoLBV8n2py7","tags":["Buenos Aires","Argentina"]},{"id":1595694311860,"src":"BuenosAires/004.jpg","name":"Centro Cultural Kirchner","location":"Buenos Aires, Argentina","marker":"https://goo.gl/maps/WZapMJWcDFrvakvA7","tags":["Buenos Aires","Argentina"]},{"id":1595694311859,"src":"BuenosAires/005.jpg","name":"Mafalda, Susanita y Manolito","location":"San Telmo. Buenos Aires, Argentina","marker":"https://goo.gl/maps/uk4uE6nAkFLR719b6","tags":["Buenos Aires","Argentina"]},{"id":1595694311858,"src":"BuenosAires/006.jpg","name":"Paseo de la Historieta","location":"San Telmo. Buenos Aires, Argentina","marker":"https://goo.gl/maps/1xyaUX8FJsYjLVsNA","tags":["Buenos Aires","Argentina"]},{"id":1595694311857,"src":"BuenosAires/007.jpg","name":"La Bombonera","location":"La Boca. Buenos Aires, Argentina","marker":"https://goo.gl/maps/XaMsB9xNQyh5Qxtx5","tags":["Buenos Aires","Argentina"]},{"id":1595694311856,"src":"BuenosAires/008.jpg","name":"Caminito","location":"La Boca. Buenos Aires, Argentina","marker":"https://goo.gl/maps/VG8uvCzxek6WRWaX7","tags":["Buenos Aires","Argentina"]},{"id":1595694311855,"src":"BuenosAires/009.jpg","name":"Cementerio de la Recoleta","location":"Recoleta. Buenos Aires, Argentina","marker":"https://goo.gl/maps/DjwenypefsDpLXxPA","tags":["Buenos Aires","Argentina"]},{"id":1595694311854,"src":"BuenosAires/010.jpg","name":"Cementerio de la Recoleta","location":"Recoleta. Buenos Aires, Argentina","marker":"https://goo.gl/maps/cPWPSzkGx5Weqweu8","tags":["Buenos Aires","Argentina"]},{"id":1595694311853,"src":"Iguacu/001.jpg","name":"Cataratas do Igua\xe7u","location":"Foz do Igua\xe7u, Brasil","marker":"https://goo.gl/maps/nsNPr8xshL8QcRzg6","tags":["Iguaz\xfa"]},{"id":1595694311852,"src":"Iguazu/001.jpg","name":"Salto Dos Hermanas","location":"Cataratas del Iguaz\xfa, Iguaz\xfa, Argentina","marker":"https://goo.gl/maps/BhrSBK9s4FFZouWA7","tags":["Iguaz\xfa","Argentina"]},{"id":1595694311851,"src":"CuevaDeLosTayos/001.jpg","name":"Cueva De Los Tayos - Tayu Jee","location":"Morona Santiago, Ecuador","marker":"https://goo.gl/maps/h6gPb6a7LtCovaRb7","tags":["Cueva de los Tayos","Ecuador"]},{"id":1595694311850,"src":"Chordeleg/002.jpg","name":"Iglesia Matriz Chordeleg","location":"Chordeleg, Azuay, Ecuador","marker":"https://goo.gl/maps/Ur9V9yTasK1R8emc8","tags":["Chordeleg","Ecuador"]},{"id":1595694311849,"src":"Chordeleg/001.jpg","name":"Parque Chordeleg","location":"Chordeleg, Azuay, Ecuador","marker":"https://goo.gl/maps/xUQTsxNFsm9bzjuC8","tags":["Chordeleg","Ecuador"]},{"id":1595694311848,"src":"Ingapirca/003.jpg","name":"Complejo Arqueol\xf3gico Ingapirca","location":"Provincia del Ca\xf1ar, Ecuador","marker":"https://goo.gl/maps/f7Vux5FfumVpuLfKA","tags":["Ingapirca","Ecuador"]},{"id":1595694311847,"src":"Ingapirca/002.jpg","name":"Complejo Arqueol\xf3gico Ingapirca","location":"Provincia del Ca\xf1ar, Ecuador","marker":"https://goo.gl/maps/f7Vux5FfumVpuLfKA","tags":["Ingapirca","Ecuador"]},{"id":1595694311846,"src":"Ingapirca/001.jpg","name":"Complejo Arqueol\xf3gico Ingapirca","location":"Provincia del Ca\xf1ar, Ecuador","marker":"https://goo.gl/maps/NnXZcj8yNRUXZmPu5","tags":["Ingapirca","Ecuador"]},{"id":1595694311845,"src":"Cuenca/006.jpg","name":"Museo Pumapungo","location":"Cuenca, Azuay, Ecuador","marker":"https://goo.gl/maps/MurthD2b3N57862v9","tags":["Cuenca","Ecuador"]},{"id":1595694311844,"src":"Cuenca/005.jpg","name":"Plaza de San Francisco","location":"Cuenca, Azuay, Ecuador","marker":"https://goo.gl/maps/DhZHUXNqhCHadKYA7","tags":["Cuenca","Ecuador"]},{"id":1595694311843,"src":"Cuenca/004.jpg","name":"Santuario Mariano del Carmen de la Asunci\xf3n","location":"Cuenca, Azuay, Ecuador","marker":"https://goo.gl/maps/abpbxPGzUDY5XxP98","tags":["Cuenca","Ecuador"]},{"id":1595694311842,"src":"Cuenca/003.jpg","name":"Catedral de la Inmaculada Concepci\xf3n","location":"Cuenca, Azuay, Ecuador","marker":"https://goo.gl/maps/hVzkHCMoMvr6TuVW9","tags":["Cuenca","Ecuador"]},{"id":1595694311841,"src":"Cuenca/002.jpg","name":"Catedral de la Inmaculada Concepci\xf3n","location":"Cuenca, Azuay, Ecuador","marker":"https://goo.gl/maps/nGTtwXhJA1757hvn8","tags":["Cuenca","Ecuador"]},{"id":1595694311840,"src":"Cuenca/001.jpg","name":"Parque Calder\xf3n","location":"Cuenca, Azuay, Ecuador","marker":"https://goo.gl/maps/Fho5YFdeoGyxSn3F7","tags":["Cuenca","Ecuador"]},{"id":1595694311839,"src":"Banos/010.jpg","name":"La Casa del \xc1rbol","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/gex5rbJCQR89zV1k8","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311838,"src":"Banos/009.jpg","name":"Cascada El Pail\xf3n del diablo","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/wxgcRNckfxkv4CBD9","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311837,"src":"Banos/008.jpg","name":"Cascada El Pail\xf3n del diablo","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/4kdKKmQJZDanWsMg9","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311836,"src":"Banos/007.jpg","name":"Bas\xedlica Cat\xf3lica Nuestra Se\xf1ora del Rosario de Agua Santa","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/EFQ6TtbVoZ1YkoES7","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311835,"src":"Banos/006.jpg","name":"Museo Fray Enrique Mideros","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/uxfaGr6txdoL4JCr5","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311834,"src":"Banos/005.jpg","name":"Museo Fray Enrique Mideros","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/o2iyKzeLYDGi8HMt8","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311833,"src":"Banos/004.jpg","name":"Museo Fray Enrique Mideros","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/o588RNjyiThegvAq8","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311832,"src":"Banos/003.jpg","name":"Museo Fray Enrique Mideros","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/wmTmkSEhRuYJpb818","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311831,"src":"Banos/002.jpg","name":"Museo Fray Enrique Mideros","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/RW68V9wLu9HFmHHS8","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311830,"src":"Banos/001.jpg","name":"Pasaje Artesanal Ermita de la Virgen","location":"Ba\xf1os de Agua Santa, Ecuador","marker":"https://goo.gl/maps/K55WGHRL5vt25jNHA","tags":["Ba\xf1os","Ecuador"]},{"id":1595694311829,"src":"Quilotoa/001.jpg","name":"Mirador del Quilotoa Shalal\xe1","location":"Pujil\xed, Cotopaxi, Ecuador","marker":"https://goo.gl/maps/1Ciqujgfnzpxoruw9","tags":["Cotopaxi","Ecuador"]},{"id":1595694311828,"src":"Chimborazo/002.jpg","name":"Volc\xe1n Chimborazo","location":"Provincia de Chimborazo, Ecuador","marker":"https://goo.gl/maps/FB3MyYht4ihVPKwR7","tags":["Chimborazo","Ecuador"]},{"id":1595694311827,"src":"Chimborazo/001.jpg","name":"Iglesia de Balbanera","location":"Provincia de Chimborazo, Ecuador","marker":"https://goo.gl/maps/zEnwNxZhNvd8rc7RA","tags":["Chimborazo","Ecuador"]},{"id":1595694311826,"src":"PuertoLopez/004.jpg","name":"Comuna Agua Blanca","location":"Provincia de Manab\xed, Ecuador","marker":"https://goo.gl/maps/CMfWvt9JHYKawLaB7","tags":["Puerto L\xf3pez","Manab\xed","Ecuador"]},{"id":1595694311825,"src":"PuertoLopez/003.jpg","name":"Comuna Agua Blanca","location":"Provincia de Manab\xed, Ecuador","marker":"https://goo.gl/maps/Aubp7Eo5Ptx5yQWFA","tags":["Puerto L\xf3pez","Manab\xed","Ecuador"]},{"id":1595694311824,"src":"PuertoLopez/002.jpg","name":"Playa de los Frailes","location":"Provincia de Manab\xed, Ecuador","marker":"https://goo.gl/maps/NaJnsZgoLrjQ9iC39","tags":["Puerto L\xf3pez","Manab\xed","Ecuador"]},{"id":1595694311823,"src":"PuertoLopez/001.jpg","name":"Muelle de Puerto L\xf3pez","location":"Provincia de Manab\xed, Ecuador","marker":"https://goo.gl/maps/SLgJJ9t31q1gLMuUA","tags":["Puerto L\xf3pez","Manab\xed","Ecuador"]},{"id":1595694311822,"src":"Guayaquil/012.jpg","name":"Monumento al Sagrado Coraz\xf3n de Jes\xfas","location":"Cerro del Carmen, Guayaquil, Ecuador","marker":"https://goo.gl/maps/5nuHZdxVxjy4n4sQA","tags":["Guayaquil","Ecuador"]},{"id":1595694311821,"src":"Guayaquil/011.jpg","name":"Hospicio del Coraz\xf3n De Jesus","location":"Parque Hist\xf3rico de Guayaquil, Samborond\xf3n, Ecuador","marker":"https://goo.gl/maps/JK3c6g3Z77v74aiU6","tags":["Guayaquil","Ecuador"]},{"id":1595694311820,"src":"Guayaquil/010.jpg","name":"Parque Hist\xf3rico de Guayaquil","location":"Samborond\xf3n, Ecuador","marker":"https://goo.gl/maps/RZt3gm4V7ofq9KRq6","tags":["Samborond\xf3n","Ecuador"]},{"id":1595694311819,"src":"Guayaquil/009.jpg","name":"Mirador Cerro Para\xedso","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/nYQftjKQ9ZBHHEd89","tags":["Guayaquil","Ecuador"]},{"id":1595694311818,"src":"Guayaquil/008.jpg","name":"Misi\xf3n Budista Templo Yuan Heng","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/NjE1RCMGhpL3NTSe9","tags":["Guayaquil","Ecuador"]},{"id":1595694311817,"src":"Guayaquil/007.jpg","name":"Parque Jard\xedn Japon\xe9s","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/YVJf7SktnqgG2PwU9","tags":["Guayaquil","Ecuador"]},{"id":1595694311816,"src":"Guayaquil/006.jpg","name":"Estadio Cristian Ben\xedtez Betancourt","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/zisYqeWTdkyDZib59","tags":["Guayaquil","Ecuador"]},{"id":1595694311815,"src":"Guayaquil/005.jpg","name":"Estadio Monumental Banco Pichincha","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/NHu8rEEqw9m8FBzQ6","tags":["Guayaquil","Ecuador"]},{"id":1595694311814,"src":"Guayaquil/004.jpg","name":"Isla Santay","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/Hf9ur5kpJPxkkese6","tags":["Guayaquil","Ecuador"]},{"id":1595694311813,"src":"Guayaquil/003.jpg","name":"Isla Santay","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/HXS1sZJGFMtwnQnf6","tags":["Guayaquil","Ecuador"]},{"id":1595694311812,"src":"Guayaquil/002.jpg","name":"Cementerio Patrimonial","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/vXDrs9QzBgvXLRAB8","tags":["Guayaquil","Ecuador"]},{"id":1595694311811,"src":"Guayaquil/001.jpg","name":"Cementerio Patrimonial","location":"Guayaquil, Ecuador","marker":"https://goo.gl/maps/Y56C1eS1oEkqwMz36","tags":["Guayaquil","Ecuador"]},{"id":1595694311810,"src":"Babahoyo/008.jpg","name":"Casa de Olmedo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/kSgtrK6F6ZiZtjq26","tags":["Babahoyo","Ecuador"]},{"id":1595694302331,"src":"Babahoyo/007.jpg","name":"Casa de Olmedo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/HgPatBPgvEcFHGzX7","tags":["Babahoyo","Ecuador"]},{"id":1595694292899,"src":"Babahoyo/006.jpg","name":"Malec\xf3n de Babahoyo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/LfoLTKsWQSVJCw2D6","tags":["Babahoyo","Ecuador"]},{"id":1595694275068,"src":"Babahoyo/005.jpg","name":"Malec\xf3n de Babahoyo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/uEEZJHLm8i2R9BHr8","tags":["Babahoyo","Ecuador"]},{"id":1595694260052,"src":"Babahoyo/004.jpg","name":"Plaza Central 24 de Mayo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/PHtcC8jP7wETE3gV9","tags":["Babahoyo","Ecuador"]},{"id":1595694242685,"src":"Babahoyo/003.jpg","name":"Plaza Central 24 de Mayo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/gbJgDxDrCinARvb58","tags":["Babahoyo","Ecuador"]},{"id":1595694227310,"src":"Babahoyo/002.jpg","name":"Plaza Central 24 de Mayo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/G7esmtVMZwURxNyP9","tags":["Babahoyo","Ecuador"]},{"id":1595694217182,"src":"Babahoyo/001.jpg","name":"Plaza Central 24 de Mayo","location":"Babahoyo, Ecuador","marker":"https://goo.gl/maps/atAXRiTYGKByr8tS7","tags":["Babahoyo","Ecuador"]}]')}},[[18,1,2]]]);
//# sourceMappingURL=main.628545c9.chunk.js.map