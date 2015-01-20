// <>
/*      El presente módulo, utiliza algunas funciones definidas en la librería JQuery 2.x, por lo que es necesaria
    *   la incusion de la misma para el correcto funcionamiento de las funciones aquí definidas.
    *
*/

/*jslint browser:true, devel:true, white:true, vars:true */
/*global $:false, intel:false app:false, dev:false, cordova:false */

var Contador = function(pendiente,tiempo,llamador){
        this.pendientePromedio = Math.abs(pendiente);
        this.tiempo = tiempo;
        this.caller = llamador;
        this.arreglo = [];
        this.sincronizado = false;
    console.log("Contador Inicializado!");
        
        
        this.calcularPendiente = function(){
            console.log('contador.calcularPendiente"');
            $("#cantPasos").empty();
            $("#cantPasos").append("calculando: "+Math.random());
//            var valores = this.arreglo.map(function(a){return a.y;});
            var valores = this.arreglo.map(function(a){return a.y;});
            var pendAuxiliar = valores.reduce(function(acum,b){
                return acum+b;
            },0);
            pendAuxiliar = pendAuxiliar/this.arreglo.length;
            var metrica = Math.abs(Math.abs(pendAuxiliar) - this.pendientePromedio);
            if((this.pendientePromedio/5) > metrica){
                this.sincronizado = true;
                this.arreglo = [];
                this.caller.notificarPaso();
            }else{
                this.sincronizado = false;
            }
            
        };    
    
        this.push = function(accel){
            if(this.arreglo.length >1){
                if((this.arreglo[this.arreglo.length -1].timestamp - this.arreglo[0].timestamp) > tiempo){
                    var paux = this.arreglo.pop();
                    this.calcularPendiente();
                    this.arreglo.push(paux);
                }
            }
            this.arreglo.push(accel);
        };
    };

var semiPodometro = (function(){
    var contador = {};
    var observador = {};
    var calibrando = false;
    var corriendo = false;
    var idOrientacion = 0;
    var idContarPasos = 0;
    var idAceleracion = 0;
    var patronPasos = [];
    var pMinModelo = {};
    var pMaxModelo = {};
    var paso = 0;
    var cantPasos = 0;
    var pendientePromedio = 0;
    var deltaT = 0;

    
    var init = function(app){
        observador = app;
        idOrientacion = setInterval(orientacion,1000);
    };

    var iniciarCalibracion = function(){
        calibrando = true;
//        document.addEventListener("intel.xdk.device.pause",pausado,false);
//        document.addEventListener("intel.xdk.device.continue",calibrar,false);
        var options = { frequency: 100, adjustForRotation: true };  // Update every 100 mili seconds
        idAceleracion = intel.xdk.accelerometer.watchAcceleration(almacenarDatosPatron, options);
    };
    
    var pausado = function(){
        console.log("pausado");
        if(calibrando){
            var options = { frequency: 100, adjustForRotation: true };  // Update every 100 mili seconds
            idAceleracion = intel.xdk.accelerometer.watchAcceleration(almacenarDatosPatron, options);
        }else{
            if(corriendo)
                verificarPasos();
        }
//        observador.pausar();
    };

    var almacenarDatosPatron = function(acceleration) {
        patronPasos.push(acceleration);
    };

    var calibrar = function(){
        intel.xdk.accelerometer.clearWatch(idAceleracion);
        document.removeEventListener("intel.xdk.device.pause");
        document.removeEventListener("intel.xdk.device.continue");
        reconocerPatron();
//        alert("Calibrando Dispositivo!");
    };


    var reconocerPatron = function(){
        alert("Cantidad de datos recogidos: "+patronPasos.length);
        var $tabla = $($("#tablaDatos tbody")[0]);
        var xMin = patronPasos[0].x;
        var xMax = patronPasos[0].x;
        var zMin = patronPasos[0].z;
        var zMax = patronPasos[0].z;

        var pMin = patronPasos[0];
        var pMax = patronPasos[0];
        for(var i=0;i<patronPasos.length-1;i++){
            var val = patronPasos[i];
            if(val.y > pMax.y){
                pMax = val;
            }
            if(val.y < pMin.y){
                pMin = val;
            }
/*            1           */
        }
        var pasosEstimados = [];
        deltaT = (patronPasos[patronPasos.length-1].timestamp - patronPasos[0].timestamp)/10;
        var tiempo = patronPasos[0].timestamp + deltaT;
        var media = [];
        var pendientes = [];
        var pendienteParcial = 0;
        var y = patronPasos[0].y;
        var x = patronPasos[0].timestamp;

        for(var j=1;j<patronPasos.length-1;j++){
            if(patronPasos[j].timestamp < tiempo ){
                var divisor = 1;
                if((patronPasos[j].timestamp - x) !== 0)
                    divisor = (patronPasos[j].timestamp == x)? 1 : (patronPasos[j].timestamp - x);
//                    divisor = (patronPasos[j].timestamp - x);
//                pendienteParcial = (patronPasos[j].y - y)/divisor;
                pendienteParcial = (patronPasos[j].y == y)? 1 : (patronPasos[j].y - y)/divisor;
                pendientes.push(pendienteParcial);
                console.log("arreglo pendiente: "+pendientes);
            }else{
                console.log("pendientes Finales: "+pendientes);
                var mediaAuxiliar = pendientes.reduce(function(a,b){
                        return a + b;
                    },0);
                mediaAuxiliar = mediaAuxiliar / pendientes.length;
                console.log("media Auxiliar: "+mediaAuxiliar);
                media.push(mediaAuxiliar);
                console.log("arreglo Medias: "+media);
                pendientes = [];
                y = patronPasos[j].y;
                x = patronPasos[j].timestamp;
                console.log("tiempo: "+tiempo+"; deltaT: "+deltaT+"; tiempo+delta= "+(tiempo + deltaT));
                tiempo = tiempo + deltaT;
            }
        }
        var sumatoriaPendientes = media.reduce(function(a,b){return a+b;});
        pendientePromedio = sumatoriaPendientes/media.length;
        console.log("Pendiente Estandar: "+pendientePromedio);
        
/*        2           */

    };

    var contarPasos = function(){
        console.log("iniciando Seguimiento");
        calibrar();
        var options = { frequency: 100, adjustForRotation: true  };  // Update every 100 mili seconds
        console.log(this);
        contador = new Contador(pendientePromedio,deltaT,this);
        idAceleracion = intel.xdk.accelerometer.watchAcceleration(pasos, options);
    };

    var pasos = function(accel){
        console.log("en Pasos");
        contador.push(accel);
/*            3           */
    };

    function orientacion(){
        var orient = intel.xdk.device.orientation;
        if((orient < -75 && orient > -105) || (orient < 105 && orient > 75)){
            observador.horizontal(orient);
//            idContarPasos = setTimeout(contarPasos,2000);
        }
    }


    var verificarPasos = function(accel){
        if(calibrando)
            patronPasos.push(accel);
        else{
            //todo lo que haga falta;
        }
    };


    var notificarPaso = function(){
        cantPasos = cantPasos +1;
        console.log("un paso reconocido");
        $("#cantPasos").empty();
        $("#cantPasos").append(cantPasos);
    };
    
    var prueba = function(){
        console.log("Modulo en Funcinamiento!");
        var tiempo = 0;
        tiempo = Date.now();
        console.log("t1: "+tiempo);
        setTimeout(function(){
            tiempo = Date.now();
            console.log("t2: "+tiempo);
        },1000);
    };
    
    
    return{inicializar:init,
           iniciarCalibracion:iniciarCalibracion,
           prueba:prueba,
           patron:patronPasos,
           procesarPatron:reconocerPatron,
           notificarPaso:notificarPaso,
           contarPasos:contarPasos
          };

}());





/*1:
            if(val.x > xMax ){
                xMax = val.x;
            }
            if (val.x < xMin ){
                xMin = val.x;
            }
            if (val.z > zMax ){
                zMax = val.z;
            }
            if (val.z < zMin ){
                zMin = val.z;
            }
*/


/*2:
        console.log("Tabla de Datos Completa!");
        console.log("datos:");
        console.log("xMax: "+xMax);
        console.log("xMin: "+xMin);
        console.log("yMax: "+pMax.y);
        console.log("yMin: "+pMin.y);
        console.log("zMax: "+zMax);
        console.log("zMin: "+zMin);
        
        pMinModelo.x = pMin.x +(pMin.x/5);
        pMinModelo.z = pMin.z +(pMin.z/5);
        pMinModelo.y = pMin.y +(pMin.y/5);
        pMaxModelo.x = pMax.x -(pMax.x/5);
        pMaxModelo.y = pMax.y -(pMax.y/5);
        pMaxModelo.z = pMax.z -(pMax.z/5);
        */


/*3

        if((paso == 0) && (pMinModelo.y > accel.y)){
            $("#cantPasos").css({'bacgroundColor':'Yellow'});
            paso = 1;
            ultimoPaso = accel;
        }else{
            console.log("Otro Paso");
            if( (paso == 1) && ((pMaxModelo.y < accel.y) || (pMinModelo.y > accel.y)) ){
                if((accel.timeStamp - ultimoPaso.timeStamp) < 500){
                    console.log("Paso Confirmado!");
                    cantPasos = cantPasos +1;
                    ultimoPaso = accel;
                    $("#cantPasos").empty();
                    $("#cantPasos").append(cantPasos);
                    $("#cantPasos").css({'bacgroundColor':'Green'});
                }else{
                    console.log("Se perdio el Paso");
                    paso = 0;
                    cantPasos = 0;
                }
            }
        }*/