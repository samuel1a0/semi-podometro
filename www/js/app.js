/*
 * Please see the included README.md file for license terms and conditions.
 */


/*jslint browser:true, devel:true, white:true, vars:true */
/*global $:false, intel:false app:false, dev:false, cordova:false */



// This file contains your event handlers, the center of your application.
// See app.initEvents() in init-app.js for event initialization.

// function myEventHandler() {
//     "use strict" ;
// // ...event handler code here...
// }


// ...additional event handlers here...
var aplicacion = (function(){
    function pausar(){
        document.getElementById("controlBloqueo").innerHTML = "Dispositivo Pausado!!!";
        }

    function sensarBloqueo(){
        document.addEventListener(intel.xdk.device.pause,pausar);
    }

    function dispositivoHorizontal(val){
        //alert("La Orientacion del Dispositivo es: "+intel.xdk.device.orientation);
        document.getElementById("controlOrientacion").innerHTML ="La Orientacion del Dispositivo es: "+val;
    }

    return{
        pausar:pausar,
        sensarBloqueo:sensarBloqueo,
        horizontal:dispositivoHorizontal
    };
}());

function sensarOrientacion(){
    document.getElementById("controlOrientacion").innerHTML ="La Orientacion del Dispositivo es: "+intel.xdk.device.orientation;
}

function resumir(){

}



function inicializar(){
    semiPodometro.inicializar(aplicacion);
   $("#botonOrientacion").click(sensarOrientacion);
   $("#botonCalibracion").click(semiPodometro.iniciarCalibracion);
   $("#botonContarPasos").click(semiPodometro.contarPasos);

//    document.getElementById("botonOrientacion").onclick = aplicacion.horizontal;
    document.addEventListener("intel.xdk.device.continue",resumir,false);
//    semiPodometro.prueba();
}
