(function () {
var Torch;
function INIT_ENGINE() {

var Torch = (() => {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(Torch) {
  Torch = Torch || {};


var d;d||(d=typeof Torch !== 'undefined' ? Torch : {});var aa,ba;d.ready=new Promise(function(a,b){aa=a;ba=b});
"undefined"!==typeof global&&"[object process]"===Object.prototype.toString.call(global.process)&&"undefined"!==typeof fetch&&("undefined"===typeof XMLHttpRequest&&(global.XMLHttpRequest=function(){var a,b={open:function(c,e){a=e},send:function(){require("fs").readFile(a,function(c,e){b.readyState=4;c?(console.error(c),b.status=404,b.onerror(c)):(b.status=200,b.response=e,b.onreadystatechange(),b.onload())})}};return b}),fetch=null);d.print=function(a){d.listener?d.listener(a):console.log(a)};
d.printErr=function(a){d.listener?d.listener(a):console.error(a)};d.terminate=function(){"undefined"!==typeof k&&k.sa()};var ca=Object.assign({},d),da=[],l="./this.program",p=(a,b)=>{throw b;},ea="object"==typeof window,v="function"==typeof importScripts,w="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,x=d.ENVIRONMENT_IS_PTHREAD||!1,z="";function fa(a){return d.locateFile?d.locateFile(a,z):z+a}var ha,A,fs,ia,ja;
if(w){z=v?require("path").dirname(z)+"/":__dirname+"/";ja=()=>{ia||(fs=require("fs"),ia=require("path"))};ha=function(b,c){ja();b=ia.normalize(b);return fs.readFileSync(b,c?void 0:"utf8")};A=b=>{b=ha(b,!0);b.buffer||(b=new Uint8Array(b));return b};1<process.argv.length&&(l=process.argv[1].replace(/\\/g,"/"));da=process.argv.slice(2);process.on("uncaughtException",function(b){if(!(b instanceof B))throw b;});process.on("unhandledRejection",function(b){throw b;});p=(b,c)=>{if(C())throw process.exitCode=
b,c;c instanceof B||D("exiting due to exception: "+c);process.exit(b)};d.inspect=function(){return"[Emscripten Module object]"};let a;try{a=require("worker_threads")}catch(b){throw console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?'),b;}global.Worker=a.Worker}else if(ea||v)v?z=self.location.href:"undefined"!=typeof document&&document.currentScript&&(z=document.currentScript.src),_scriptDir&&(z=_scriptDir),0!==z.indexOf("blob:")?z=
z.substr(0,z.replace(/[?#].*/,"").lastIndexOf("/")+1):z="",w||(ha=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},v&&(A=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}));w&&"undefined"==typeof performance&&(global.performance=require("perf_hooks").performance);var ka=console.log.bind(console),la=console.warn.bind(console);w&&(ja(),ka=a=>fs.writeSync(1,a+"\n"),la=a=>fs.writeSync(2,a+"\n"));
var ma=d.print||ka,D=d.printErr||la;Object.assign(d,ca);ca=null;d.arguments&&(da=d.arguments);d.thisProgram&&(l=d.thisProgram);d.quit&&(p=d.quit);var E,F;d.wasmBinary&&(F=d.wasmBinary);var noExitRuntime=d.noExitRuntime||!0;"object"!=typeof WebAssembly&&G("no native wasm support detected");var I,na,oa=!1;function pa(a){var b=new TextDecoder(a);this.decode=c=>{c.buffer instanceof SharedArrayBuffer&&(c=new Uint8Array(c));return b.decode.call(b,c)}}
var qa="undefined"!=typeof TextDecoder?new pa("utf8"):void 0;
function ra(a,b,c){var e=b+c;for(c=b;a[c]&&!(c>=e);)++c;if(16<c-b&&a.subarray&&qa)return qa.decode(a.subarray(b,c));for(e="";b<c;){var g=a[b++];if(g&128){var h=a[b++]&63;if(192==(g&224))e+=String.fromCharCode((g&31)<<6|h);else{var m=a[b++]&63;g=224==(g&240)?(g&15)<<12|h<<6|m:(g&7)<<18|h<<12|m<<6|a[b++]&63;65536>g?e+=String.fromCharCode(g):(g-=65536,e+=String.fromCharCode(55296|g>>10,56320|g&1023))}}else e+=String.fromCharCode(g)}return e}function J(a){return a?ra(K,a,void 0):""}
function L(a,b,c,e){if(0<e){e=c+e-1;for(var g=0;g<a.length;++g){var h=a.charCodeAt(g);if(55296<=h&&57343>=h){var m=a.charCodeAt(++g);h=65536+((h&1023)<<10)|m&1023}if(127>=h){if(c>=e)break;b[c++]=h}else{if(2047>=h){if(c+1>=e)break;b[c++]=192|h>>6}else{if(65535>=h){if(c+2>=e)break;b[c++]=224|h>>12}else{if(c+3>=e)break;b[c++]=240|h>>18;b[c++]=128|h>>12&63}b[c++]=128|h>>6&63}b[c++]=128|h&63}}b[c]=0}}
function sa(a){for(var b=0,c=0;c<a.length;++c){var e=a.charCodeAt(c);55296<=e&&57343>=e&&(e=65536+((e&1023)<<10)|a.charCodeAt(++c)&1023);127>=e?++b:b=2047>=e?b+2:65535>=e?b+3:b+4}return b}"undefined"!=typeof TextDecoder&&new pa("utf-16le");function ta(a){var b=sa(a)+1,c=M(b);L(a,N,c,b);return c}var O,N,K,P,ua;x&&(O=d.buffer);var va=d.INITIAL_MEMORY||536870912;
if(x)I=d.wasmMemory,O=d.buffer;else if(d.wasmMemory)I=d.wasmMemory;else if(I=new WebAssembly.Memory({initial:va/65536,maximum:va/65536,shared:!0}),!(I.buffer instanceof SharedArrayBuffer))throw D("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag"),w&&console.log("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and also use a recent version)"),
Error("bad memory");I&&(O=I.buffer);va=O.byteLength;var R=O;O=R;d.HEAP8=N=new Int8Array(R);d.HEAP16=new Int16Array(R);d.HEAP32=P=new Int32Array(R);d.HEAPU8=K=new Uint8Array(R);d.HEAPU16=new Uint16Array(R);d.HEAPU32=new Uint32Array(R);d.HEAPF32=new Float32Array(R);d.HEAPF64=ua=new Float64Array(R);var wa,xa=[],ya=[],za=[],Aa=[],Ba=0;function C(){return noExitRuntime||0<Ba}function Ca(){var a=d.preRun.shift();xa.unshift(a)}var S=0,Da=null,T=null;d.preloadedImages={};d.preloadedAudios={};
function G(a){if(x)postMessage({cmd:"onAbort",arg:a});else if(d.onAbort)d.onAbort(a);a="Aborted("+a+")";D(a);oa=!0;a=new WebAssembly.RuntimeError(a+". Build with -s ASSERTIONS=1 for more info.");ba(a);throw a;}function Ea(){return U.startsWith("data:application/octet-stream;base64,")}var U;U="torch-$TORCH_VERSION.wasm";Ea()||(U=fa(U));function Fa(){var a=U;try{if(a==U&&F)return new Uint8Array(F);if(A)return A(a);throw"both async and sync fetching of the wasm failed";}catch(b){G(b)}}
function Ga(){return F||!ea&&!v||"function"!=typeof fetch?Promise.resolve().then(function(){return Fa()}):fetch(U,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+U+"'";return a.arrayBuffer()}).catch(function(){return Fa()})}var Ha={};function V(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(d);else{var c=b.Ya;"number"==typeof c?void 0===b.fa?Ia(c)():Ia(c)(b.fa):c(void 0===b.fa?null:b.fa)}}}
function Ja(a){var b=Ka();a=a();W(b);return a}function La(a){var b=k.$[a];b&&(P[a>>2]=0,k.wa(b.worker))}function Ma(a){a instanceof B||"unwind"==a||p(1,a)}
var k={ba:[],ha:[],ma:[],qa:function(){x&&k.Ia()},ab:function(){},Ia:function(){k.receiveObjectTransfer=k.La;k.threadInit=k.xa;k.setExitStatus=k.Na;noExitRuntime=!1},$:{},Na:function(){},sa:function(){for(var a in k.$){var b=k.$[a];b&&b.worker&&k.wa(b.worker)}for(a=0;a<k.ba.length;++a)k.ba[a].terminate();k.ba=[]},wa:function(a){k.Ma(function(){delete k.$[a.da.ta];k.ba.push(a);k.ha.splice(k.ha.indexOf(a),1);Na(a.da.ta);a.da=void 0})},Ma:function(a){P[Oa>>2]=0;try{a()}finally{P[Oa>>2]=1}},La:function(){},
xa:function(){for(var a in k.ma)if(k.ma.hasOwnProperty(a))k.ma[a]()},Ja:function(a,b){a.onmessage=c=>{c=c.data;var e=c.cmd;a.da&&(k.Ca=a.da.ta);if(c.targetThread&&c.targetThread!=X()){var g=k.$[c.gb];g?g.worker.postMessage(c,c.transferList):D('Internal error! Worker sent a message "'+e+'" to target pthread '+c.targetThread+", but that thread no longer exists!")}else if("processQueuedMainThreadWork"===e)Pa();else if("spawnThread"===e)Qa(c);else if("cleanupThread"===e)La(c.thread);else if("killThread"===
e)c=c.thread,P[c>>2]=0,e=k.$[c],delete k.$[c],e.worker.terminate(),Na(c),k.ha.splice(k.ha.indexOf(e.worker),1),e.worker.da=void 0;else if("cancelThread"===e)k.$[c.thread].worker.postMessage({cmd:"cancel"});else if("loaded"===e)a.loaded=!0,b&&b(a),a.ga&&(a.ga(),delete a.ga);else if("print"===e)ma("Thread "+c.threadId+": "+c.text);else if("printErr"===e)D("Thread "+c.threadId+": "+c.text);else if("alert"===e)alert("Thread "+c.threadId+": "+c.text);else if("setimmediate"===c.target)a.postMessage(c);
else if("onAbort"===e){if(d.onAbort)d.onAbort(c.arg)}else D("worker sent an unknown command "+e);k.Ca=void 0};a.onerror=c=>{D("worker sent an error! "+c.filename+":"+c.lineno+": "+c.message);throw c;};w&&(a.on("message",function(c){a.onmessage({data:c})}),a.on("error",function(c){a.onerror(c)}),a.on("detachedExit",function(){}));a.postMessage({cmd:"load",urlOrBlob:d.mainScriptUrlOrBlob||_scriptDir,wasmMemory:I,wasmModule:na})},Aa:function(){var a=fa("torch.worker.js");k.ba.push(new Worker(a))},Ga:function(){0==
k.ba.length&&(k.Aa(),k.Ja(k.ba[0]));return k.ba.pop()}};d.establishStackSpace=function(){var a=X(),b=P[a+44>>2];Ra(b,b-P[a+48>>2]);W(b)};function Sa(a){if(x)return Y(1,0,a);try{Ta(a)}catch(b){Ma(b)}}var Z=[];function Ia(a){var b=Z[a];b||(a>=Z.length&&(Z.length=a+1),Z[a]=b=wa.get(a));return b}d.invokeEntryPoint=function(a,b){return Ia(a)(b)};var Ua;Ua=w?()=>{var a=process.hrtime();return 1E3*a[0]+a[1]/1E6}:x?()=>performance.now()-d.__performance_now_clock_drift:()=>performance.now();
function Va(a){this.aa=a-16;this.Ea=function(b){P[this.aa+4>>2]=b};this.za=function(b){P[this.aa+8>>2]=b};this.Ba=function(){P[this.aa>>2]=0};this.ya=function(){N[this.aa+12>>0]=0};this.Da=function(){N[this.aa+13>>0]=0};this.qa=function(b,c){this.Ea(b);this.za(c);this.Ba();this.ya();this.Da()}}var Wa=0;
function Qa(a){var b=k.Ga();if(!b)return 6;k.ha.push(b);var c=k.$[a.ra]={worker:b,ta:a.ra};b.da=c;var e={cmd:"run",start_routine:a.Oa,arg:a.fa,threadInfoStruct:a.ra};b.ga=()=>{e.time=performance.now();b.postMessage(e,a.Ta)};b.loaded&&(b.ga(),delete b.ga);return 0}var Xa=[null,[],[]],Ya={};function Za(a,b,c){return x?Y(2,1,a,b,c):0}function $a(a,b,c){return x?Y(3,1,a,b,c):0}function ab(a,b,c){if(x)return Y(4,1,a,b,c)}
function Y(a,b){var c=arguments.length-2,e=arguments;return Ja(function(){for(var g=M(8*c),h=g>>3,m=0;m<c;m++)ua[h+m]=e[2+m];return bb(a,c,g,b)})}var cb=[];function db(a,b,c,e){Ja(function(){var g=M(12),h=0;if(b){h=sa(b)+1;var m=eb(h);L(b,K,m,h);h=m}P[g>>2]=h;P[g+4>>2]=c;P[g+8>>2]=e;fb(a,657457152,0,h,g)})}var gb=[0,"undefined"!=typeof document?document:0,"undefined"!=typeof window?window:0];
function hb(a){a=2<a?J(a):a;return gb[a]||("undefined"!=typeof document?document.querySelector(a):void 0)}function ib(a,b,c){var e=hb(a);if(!e)return-4;e.la&&(P[e.la>>2]=b,P[e.la+4>>2]=c);if(e.va||!e.Va)e.va&&(e=e.va),a=!1,e.ka&&e.ka.ja&&(a=e.ka.ja.getParameter(2978),a=0===a[0]&&0===a[1]&&a[2]===e.width&&a[3]===e.height),e.width=b,e.height=c,a&&e.ka.ja.viewport(0,0,b,c);else return e.la?(e=P[e.la+8>>2],a=a?J(a):"",db(e,a,b,c),1):-4;return 0}function jb(a,b,c){return x?Y(5,1,a,b,c):ib(a,b,c)}
function kb(a){var b=a.getExtension("ANGLE_instanced_arrays");b&&(a.vertexAttribDivisor=function(c,e){b.vertexAttribDivisorANGLE(c,e)},a.drawArraysInstanced=function(c,e,g,h){b.drawArraysInstancedANGLE(c,e,g,h)},a.drawElementsInstanced=function(c,e,g,h,m){b.drawElementsInstancedANGLE(c,e,g,h,m)})}
function lb(a){var b=a.getExtension("OES_vertex_array_object");b&&(a.createVertexArray=function(){return b.createVertexArrayOES()},a.deleteVertexArray=function(c){b.deleteVertexArrayOES(c)},a.bindVertexArray=function(c){b.bindVertexArrayOES(c)},a.isVertexArray=function(c){return b.isVertexArrayOES(c)})}function mb(a){var b=a.getExtension("WEBGL_draw_buffers");b&&(a.drawBuffers=function(c,e){b.drawBuffersWEBGL(c,e)})}
function nb(a,b){a.aa||(a.aa=a.getContext,a.getContext=function(e,g){g=a.aa(e,g);return"webgl"==e==g instanceof WebGLRenderingContext?g:null});var c=a.getContext("webgl",b);return c?ob(c,b):0}function ob(a,b){var c=eb(8);P[c+4>>2]=X();var e={$a:c,attributes:b,version:b.Ka,ja:a};a.canvas&&(a.canvas.ka=e);("undefined"==typeof b.ua||b.ua)&&pb(e);return c}
function pb(a){a||(a=sb);if(!a.Ha){a.Ha=!0;var b=a.ja;kb(b);lb(b);mb(b);b.Wa=b.getExtension("EXT_disjoint_timer_query");b.cb=b.getExtension("WEBGL_multi_draw");(b.getSupportedExtensions()||[]).forEach(function(c){c.includes("lose_context")||c.includes("debug")||b.getExtension(c)})}}var sb,tb=["default","low-power","high-performance"],ub={};
function vb(){if(!wb){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"==typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:l||"./this.program"},b;for(b in ub)void 0===ub[b]?delete a[b]:a[b]=ub[b];var c=[];for(b in a)c.push(b+"="+a[b]);wb=c}return wb}var wb;
function xb(a,b){if(x)return Y(6,1,a,b);var c=0;vb().forEach(function(e,g){var h=b+c;g=P[a+4*g>>2]=h;for(h=0;h<e.length;++h)N[g++>>0]=e.charCodeAt(h);N[g>>0]=0;c+=e.length+1});return 0}function yb(a,b){if(x)return Y(7,1,a,b);var c=vb();P[a>>2]=c.length;var e=0;c.forEach(function(g){e+=g.length+1});P[b>>2]=e;return 0}function zb(a){return x?Y(8,1,a):0}function Ab(a,b,c,e){if(x)return Y(9,1,a,b,c,e);a=Ya.Za(a);b=Ya.Xa(a,b,c);P[e>>2]=b;return 0}function Bb(a,b,c,e,g){if(x)return Y(10,1,a,b,c,e,g)}
function Cb(a,b,c,e){if(x)return Y(11,1,a,b,c,e);for(var g=0,h=0;h<c;h++){var m=P[b>>2],u=P[b+4>>2];b+=8;for(var y=0;y<u;y++){var q=K[m+y],r=Xa[a];0===q||10===q?((1===a?ma:D)(ra(r,0)),r.length=0):r.push(q)}g+=u}P[e>>2]=g;return 0}function Db(a){return 0===a%4&&(0!==a%100||0===a%400)}function Eb(a,b){for(var c=0,e=0;e<=b;c+=a[e++]);return c}var Fb=[31,29,31,30,31,30,31,31,30,31,30,31],Gb=[31,28,31,30,31,30,31,31,30,31,30,31];
function Hb(a,b){for(a=new Date(a.getTime());0<b;){var c=a.getMonth(),e=(Db(a.getFullYear())?Fb:Gb)[c];if(b>e-a.getDate())b-=e-a.getDate()+1,a.setDate(1),11>c?a.setMonth(c+1):(a.setMonth(0),a.setFullYear(a.getFullYear()+1));else{a.setDate(a.getDate()+b);break}}return a}
function Ib(a,b,c,e){function g(f,n,t){for(f="number"==typeof f?f.toString():f||"";f.length<n;)f=t[0]+f;return f}function h(f,n){return g(f,n,"0")}function m(f,n){function t(qb){return 0>qb?-1:0<qb?1:0}var H;0===(H=t(f.getFullYear()-n.getFullYear()))&&0===(H=t(f.getMonth()-n.getMonth()))&&(H=t(f.getDate()-n.getDate()));return H}function u(f){switch(f.getDay()){case 0:return new Date(f.getFullYear()-1,11,29);case 1:return f;case 2:return new Date(f.getFullYear(),0,3);case 3:return new Date(f.getFullYear(),
0,2);case 4:return new Date(f.getFullYear(),0,1);case 5:return new Date(f.getFullYear()-1,11,31);case 6:return new Date(f.getFullYear()-1,11,30)}}function y(f){f=Hb(new Date(f.Z+1900,0,1),f.pa);var n=new Date(f.getFullYear()+1,0,4),t=u(new Date(f.getFullYear(),0,4));n=u(n);return 0>=m(t,f)?0>=m(n,f)?f.getFullYear()+1:f.getFullYear():f.getFullYear()-1}var q=P[e+40>>2];e={Ra:P[e>>2],Qa:P[e+4>>2],na:P[e+8>>2],ia:P[e+12>>2],ea:P[e+16>>2],Z:P[e+20>>2],oa:P[e+24>>2],pa:P[e+28>>2],hb:P[e+32>>2],Pa:P[e+36>>
2],Sa:q?J(q):""};c=J(c);q={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var r in q)c=c.replace(new RegExp(r,"g"),q[r]);var Q="Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
rb="January February March April May June July August September October November December".split(" ");q={"%a":function(f){return Q[f.oa].substring(0,3)},"%A":function(f){return Q[f.oa]},"%b":function(f){return rb[f.ea].substring(0,3)},"%B":function(f){return rb[f.ea]},"%C":function(f){return h((f.Z+1900)/100|0,2)},"%d":function(f){return h(f.ia,2)},"%e":function(f){return g(f.ia,2," ")},"%g":function(f){return y(f).toString().substring(2)},"%G":function(f){return y(f)},"%H":function(f){return h(f.na,
2)},"%I":function(f){f=f.na;0==f?f=12:12<f&&(f-=12);return h(f,2)},"%j":function(f){return h(f.ia+Eb(Db(f.Z+1900)?Fb:Gb,f.ea-1),3)},"%m":function(f){return h(f.ea+1,2)},"%M":function(f){return h(f.Qa,2)},"%n":function(){return"\n"},"%p":function(f){return 0<=f.na&&12>f.na?"AM":"PM"},"%S":function(f){return h(f.Ra,2)},"%t":function(){return"\t"},"%u":function(f){return f.oa||7},"%U":function(f){var n=new Date(f.Z+1900,0,1),t=0===n.getDay()?n:Hb(n,7-n.getDay());f=new Date(f.Z+1900,f.ea,f.ia);return 0>
m(t,f)?h(Math.ceil((31-t.getDate()+(Eb(Db(f.getFullYear())?Fb:Gb,f.getMonth()-1)-31)+f.getDate())/7),2):0===m(t,n)?"01":"00"},"%V":function(f){var n=new Date(f.Z+1901,0,4),t=u(new Date(f.Z+1900,0,4));n=u(n);var H=Hb(new Date(f.Z+1900,0,1),f.pa);return 0>m(H,t)?"53":0>=m(n,H)?"01":h(Math.ceil((t.getFullYear()<f.Z+1900?f.pa+32-t.getDate():f.pa+1-t.getDate())/7),2)},"%w":function(f){return f.oa},"%W":function(f){var n=new Date(f.Z,0,1),t=1===n.getDay()?n:Hb(n,0===n.getDay()?1:7-n.getDay()+1);f=new Date(f.Z+
1900,f.ea,f.ia);return 0>m(t,f)?h(Math.ceil((31-t.getDate()+(Eb(Db(f.getFullYear())?Fb:Gb,f.getMonth()-1)-31)+f.getDate())/7),2):0===m(t,n)?"01":"00"},"%y":function(f){return(f.Z+1900).toString().substring(2)},"%Y":function(f){return f.Z+1900},"%z":function(f){f=f.Pa;var n=0<=f;f=Math.abs(f)/60;return(n?"+":"-")+String("0000"+(f/60*100+f%60)).slice(-4)},"%Z":function(f){return f.Sa},"%%":function(){return"%"}};c=c.replace(/%%/g,"\x00\x00");for(r in q)c.includes(r)&&(c=c.replace(new RegExp(r,"g"),
q[r](e)));c=c.replace(/\0\0/g,"%");r=Jb(c);if(r.length>b)return 0;N.set(r,a);return r.length-1}k.qa();var Kb=[null,Sa,Za,$a,ab,jb,xb,yb,zb,Ab,Bb,Cb];function Jb(a){var b=Array(sa(a)+1);L(a,b,0,b.length);return b}
var Ob={k:function(a){return eb(a+16)+16},j:function(a,b,c){(new Va(a)).qa(b,c);Wa++;throw a;},A:function(a){Lb(a,!v,1,!ea);k.xa()},g:function(a){x?postMessage({cmd:"cleanupThread",thread:a}):La(a)},h:function(a,b,c,e){if("undefined"==typeof SharedArrayBuffer)return D("Current environment does not support SharedArrayBuffer, pthreads are not available!"),6;var g=[];if(x&&0===g.length)return Mb(687865856,a,b,c,e);a={Oa:c,ra:a,fa:e,Ta:g};return x?(a.Ua="spawnThread",postMessage(a,g),0):Qa(a)},e:Za,n:$a,
o:ab,w:function(){return 2097152},B:function(a,b){if(a==b)postMessage({cmd:"processQueuedMainThreadWork"});else if(x)postMessage({targetThread:a,cmd:"processThreadQueue"});else{a=(a=k.$[a])&&a.worker;if(!a)return;a.postMessage({cmd:"processThreadQueue"})}return 1},d:function(){G("")},u:function(a,b){if(0===a)a=Date.now();else if(1===a||4===a)a=Ua();else return P[Nb()>>2]=28,-1;P[b>>2]=a/1E3|0;P[b+4>>2]=a%1E3*1E6|0;return 0},f:function(){w||v||(E||(E={}),E["Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread"]||
(E["Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread"]=1,D("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread")))},b:Ua,C:function(a,b,c){K.copyWithin(a,b,b+c)},x:function(a,b,c){cb.length=b;c>>=3;for(var e=0;e<b;e++)cb[e]=ua[c+e];return(0>a?Ha[-a-1]:Kb[a]).apply(null,cb)},v:function(){G("OOM")},y:function(a,b,c){return hb(a)?
ib(a,b,c):jb(a,b,c)},p:function(){throw"unwind";},z:function(a,b){b>>=2;b={alpha:!!P[b],depth:!!P[b+1],stencil:!!P[b+2],antialias:!!P[b+3],premultipliedAlpha:!!P[b+4],preserveDrawingBuffer:!!P[b+5],powerPreference:tb[P[b+6]],failIfMajorPerformanceCaveat:!!P[b+7],Ka:P[b+8],bb:P[b+9],ua:P[b+10],Fa:P[b+11],eb:P[b+12],fb:P[b+13]};a=hb(a);return!a||b.Fa?0:nb(a,b)},s:xb,t:yb,c:function(a){Ta(a)},i:zb,m:Ab,q:Bb,l:Cb,a:I||d.wasmMemory,r:function(a,b,c,e){return Ib(a,b,c,e)}};
(function(){function a(g,h){d.asm=g.exports;k.ma.push(d.asm.I);wa=d.asm.O;ya.unshift(d.asm.D);na=h;x||(S--,d.monitorRunDependencies&&d.monitorRunDependencies(S),0==S&&(null!==Da&&(clearInterval(Da),Da=null),T&&(g=T,T=null,g())))}function b(g){a(g.instance,g.module)}function c(g){return Ga().then(function(h){return WebAssembly.instantiate(h,e)}).then(function(h){return h}).then(g,function(h){D("failed to asynchronously prepare wasm: "+h);G(h)})}var e={a:Ob};x||(S++,d.monitorRunDependencies&&d.monitorRunDependencies(S));
if(d.instantiateWasm)try{return d.instantiateWasm(e,a)}catch(g){return D("Module.instantiateWasm callback failed with error: "+g),!1}(function(){return F||"function"!=typeof WebAssembly.instantiateStreaming||Ea()||"function"!=typeof fetch?c(b):fetch(U,{credentials:"same-origin"}).then(function(g){return WebAssembly.instantiateStreaming(g,e).then(b,function(h){D("wasm streaming compile failed: "+h);D("falling back to ArrayBuffer instantiation");return c(b)})})})().catch(ba);return{}})();
d.___wasm_call_ctors=function(){return(d.___wasm_call_ctors=d.asm.D).apply(null,arguments)};d._free=function(){return(d._free=d.asm.E).apply(null,arguments)};d._main=function(){return(d._main=d.asm.F).apply(null,arguments)};d._command=function(){return(d._command=d.asm.G).apply(null,arguments)};var eb=d._malloc=function(){return(eb=d._malloc=d.asm.H).apply(null,arguments)};d._emscripten_tls_init=function(){return(d._emscripten_tls_init=d.asm.I).apply(null,arguments)};
var Nb=d.___errno_location=function(){return(Nb=d.___errno_location=d.asm.J).apply(null,arguments)};d.__emscripten_thread_crashed=function(){return(d.__emscripten_thread_crashed=d.asm.K).apply(null,arguments)};
var Lb=d.__emscripten_thread_init=function(){return(Lb=d.__emscripten_thread_init=d.asm.L).apply(null,arguments)},X=d._pthread_self=function(){return(X=d._pthread_self=d.asm.M).apply(null,arguments)},Pa=d._emscripten_main_thread_process_queued_calls=function(){return(Pa=d._emscripten_main_thread_process_queued_calls=d.asm.N).apply(null,arguments)};d._emscripten_current_thread_process_queued_calls=function(){return(d._emscripten_current_thread_process_queued_calls=d.asm.P).apply(null,arguments)};
var Mb=d._emscripten_sync_run_in_main_thread_4=function(){return(Mb=d._emscripten_sync_run_in_main_thread_4=d.asm.Q).apply(null,arguments)},bb=d._emscripten_run_in_main_runtime_thread_js=function(){return(bb=d._emscripten_run_in_main_runtime_thread_js=d.asm.R).apply(null,arguments)},fb=d._emscripten_dispatch_to_thread_=function(){return(fb=d._emscripten_dispatch_to_thread_=d.asm.S).apply(null,arguments)},Na=d.__emscripten_thread_free_data=function(){return(Na=d.__emscripten_thread_free_data=d.asm.T).apply(null,
arguments)};d.__emscripten_thread_exit=function(){return(d.__emscripten_thread_exit=d.asm.U).apply(null,arguments)};
var Ra=d._emscripten_stack_set_limits=function(){return(Ra=d._emscripten_stack_set_limits=d.asm.V).apply(null,arguments)},Ka=d.stackSave=function(){return(Ka=d.stackSave=d.asm.W).apply(null,arguments)},W=d.stackRestore=function(){return(W=d.stackRestore=d.asm.X).apply(null,arguments)},M=d.stackAlloc=function(){return(M=d.stackAlloc=d.asm.Y).apply(null,arguments)},Oa=d.__emscripten_allow_main_runtime_queued_calls=74444408;
d.ccall=function(a,b,c,e){var g={string:function(q){var r=0;if(null!==q&&void 0!==q&&0!==q){var Q=(q.length<<2)+1;r=M(Q);L(q,K,r,Q)}return r},array:function(q){var r=M(q.length);N.set(q,r);return r}};a=d["_"+a];var h=[],m=0;if(e)for(var u=0;u<e.length;u++){var y=g[c[u]];y?(0===m&&(m=Ka()),h[u]=y(e[u])):h[u]=e[u]}c=a.apply(null,h);return c=function(q){0!==m&&W(m);return"string"===b?J(q):"boolean"===b?!!q:q}(c)};d.keepRuntimeAlive=C;d.PThread=k;d.PThread=k;d.wasmMemory=I;d.ExitStatus=B;var Pb;
function B(a){this.name="ExitStatus";this.message="Program terminated with exit("+a+")";this.status=a}T=function Qb(){Pb||Rb();Pb||(T=Qb)};
function Rb(a){function b(){if(!Pb&&(Pb=!0,d.calledRun=!0,!oa)){x||V(ya);x||V(za);aa(d);if(d.onRuntimeInitialized)d.onRuntimeInitialized();if(Sb){var c=a,e=d._main;c=c||[];var g=c.length+1,h=M(4*(g+1));P[h>>2]=ta(l);for(var m=1;m<g;m++)P[(h>>2)+m]=ta(c[m-1]);P[(h>>2)+g]=0;try{var u=e(g,h);Ta(u,!0)}catch(y){Ma(y)}finally{}}if(!x){if(d.postRun)for("function"==typeof d.postRun&&(d.postRun=[d.postRun]);d.postRun.length;)c=d.postRun.shift(),Aa.unshift(c);V(Aa)}}}a=a||da;if(!(0<S))if(x)aa(d),x||V(ya),postMessage({cmd:"loaded"});
else{if(d.preRun)for("function"==typeof d.preRun&&(d.preRun=[d.preRun]);d.preRun.length;)Ca();V(xa);0<S||(d.setStatus?(d.setStatus("Running..."),setTimeout(function(){setTimeout(function(){d.setStatus("")},1);b()},1)):b())}}d.run=Rb;function Ta(a,b){if(!b&&x)throw Sa(a),"unwind";C()||x||k.sa();if(!C()){k.sa();if(d.onExit)d.onExit(a);oa=!0}p(a,new B(a))}if(d.preInit)for("function"==typeof d.preInit&&(d.preInit=[d.preInit]);0<d.preInit.length;)d.preInit.pop()();var Sb=!0;d.noInitialRun&&(Sb=!1);Rb();


  return Torch.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = Torch;
else if (typeof define === 'function' && define['amd'])
  define([], function() { return Torch; });
else if (typeof exports === 'object')
  exports["Torch"] = Torch;
return Torch;
}

if (typeof self !== "undefined" && self.location.hash.split(",")[1] === "worker" || typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]" && !require("worker_threads").isMainThread) {
    (function() {
        /// Insert worker here
"use strict";var Module={};var ENVIRONMENT_IS_NODE=typeof process=="object"&&typeof process.versions=="object"&&typeof process.versions.node=="string";if(ENVIRONMENT_IS_NODE){var nodeWorkerThreads=require("worker_threads");var parentPort=nodeWorkerThreads.parentPort;parentPort.on("message",function(data){onmessage({data:data})});var fs=require("fs");Object.assign(global,{self:global,require:require,Module:Module,location:{href:__filename},Worker:nodeWorkerThreads.Worker,importScripts:function(f){(0,eval)(fs.readFileSync(f,"utf8"))},postMessage:function(msg){parentPort.postMessage(msg)},performance:global.performance||{now:function(){return Date.now()}}})}function threadPrintErr(){var text=Array.prototype.slice.call(arguments).join(" ");if(ENVIRONMENT_IS_NODE){fs.writeSync(2,text+"\n");return}console.error(text)}function threadAlert(){var text=Array.prototype.slice.call(arguments).join(" ");postMessage({cmd:"alert",text:text,threadId:Module["_pthread_self"]()})}var err=threadPrintErr;self.alert=threadAlert;Module["instantiateWasm"]=((info,receiveInstance)=>{var instance=new WebAssembly.Instance(Module["wasmModule"],info);receiveInstance(instance);Module["wasmModule"]=null;return instance.exports});self.onmessage=(e=>{try{if(e.data.cmd==="load"){Module["wasmModule"]=e.data.wasmModule;Module["wasmMemory"]=e.data.wasmMemory;Module["buffer"]=Module["wasmMemory"].buffer;Module["ENVIRONMENT_IS_PTHREAD"]=true;if(typeof e.data.urlOrBlob=="string"){importScripts(e.data.urlOrBlob)}else{var objectUrl=URL.createObjectURL(e.data.urlOrBlob);importScripts(objectUrl);URL.revokeObjectURL(objectUrl)}Torch(Module).then(function(instance){Module=instance})}else if(e.data.cmd==="run"){Module["__performance_now_clock_drift"]=performance.now()-e.data.time;Module["__emscripten_thread_init"](e.data.threadInfoStruct,/*isMainBrowserThread=*/0,/*isMainRuntimeThread=*/0,/*canBlock=*/1);Module["establishStackSpace"]();Module["PThread"].receiveObjectTransfer(e.data);Module["PThread"].threadInit();try{var result=Module["invokeEntryPoint"](e.data.start_routine,e.data.arg);if(Module["keepRuntimeAlive"]()){Module["PThread"].setExitStatus(result)}else{Module["__emscripten_thread_exit"](result)}}catch(ex){if(ex!="unwind"){if(ex instanceof Module["ExitStatus"]){if(Module["keepRuntimeAlive"]()){}else{Module["__emscripten_thread_exit"](ex.status)}}else{throw ex}}}}else if(e.data.cmd==="cancel"){if(Module["_pthread_self"]()){Module["__emscripten_thread_exit"](-1)}}else if(e.data.target==="setimmediate"){}else if(e.data.cmd==="processThreadQueue"){if(Module["_pthread_self"]()){Module["_emscripten_current_thread_process_queued_calls"]()}}else if(e.data.cmd==="processProxyingQueue"){if(Module["_pthread_self"]()){Module["_emscripten_proxy_execute_queue"](e.data.queue)}}else{err("worker.js received unknown command "+e.data.cmd);err(e.data)}}catch(ex){err("worker.js onmessage() captured an uncaught exception: "+ex);if(ex&&ex.stack)err(ex.stack);if(Module["__emscripten_thread_crashed"]){Module["__emscripten_thread_crashed"]()}throw ex}});
self._origOnmessage = self.onmessage;
self.onmessage = function (e)
{
    if (e.data.cmd === "load") {
        // Preload command that is called once per worker to parse and load the Emscripten code.
        // Module and memory were sent from main thread
        Module["wasmModule"] = e.data.wasmModule;
        Module["wasmMemory"] = e.data.wasmMemory;
        Module["buffer"] = Module["wasmMemory"].buffer;
        Module["ENVIRONMENT_IS_PTHREAD"] = true;
        if (e.data.workerID) {
            Module['workerID'] = e.data.workerID;
        }
        if (e.data.wasmSourceMap) {
            Module['wasmSourceMapData'] = e.data.wasmSourceMap;
        }
        if (e.data.wasmOffsetConverter) {
            Module['wasmOffsetData'] = e.data.wasmOffsetConverter;
        }
        Torch = INIT_ENGINE();
        Torch(Module).then(function (instance)
        {
            Module = instance;
        });
    } else {
        self._origOnmessage(e);
    }
};
    })();
/// Is it a web worker?
} else if (typeof onmessage !== "undefined" && (typeof window === "undefined" || typeof window.document === "undefined") || typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]") {
    (function ()
    {
        var isNode = typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]";
        var engine = {};
        var queue = [];
        var wasmPath;

        if (isNode) {
            ///NOTE: Node.js v14-19 needs --experimental-wasm-threads --experimental-wasm-simd
            /// Was it called directly?
            if (require.main === module) {
                (function ()
                {
                    var p = require("path");
                    
                    function assembleWASM(count)
                    {
                        var fs = require("fs");
                        var ext = p.extname(wasmPath);
                        var basename = wasmPath.slice(0, -ext.length);
                        var i;
                        var buffers = [];
                        
                        for (i = 0; i < count; ++i) {
                            buffers.push(fs.readFileSync(basename + "-part-" + i + ".wasm"));
                        }
                        
                        return Buffer.concat(buffers);
                    }
                    
                    wasmPath = p.join(__dirname, p.basename(__filename, p.extname(__filename)) + ".wasm");
                    engine = {
                        locateFile: function (path)
                        {
                            if (path.indexOf(".wasm") > -1) {
                                if (path.indexOf(".wasm.map") > -1) {
                                    /// Set the path to the wasm map.
                                    return wasmPath + ".map"
                                }
                                /// Set the path to the wasm binary.
                                return wasmPath;
                            }
                            /// Set path to worker
                            return __filename;
                        },
                        listener: function onMessage(line)
                        {
                            process.stdout.write(line + "\n");
                        },
                    };
                    
                    if (typeof enginePartsCount === "number") {
                        /// Prepare the wasm data because it is in parts.
                        engine.wasmBinary = assembleWASM(enginePartsCount);
                    }
                }());

                Torch = INIT_ENGINE();
                Torch(engine).then(function ()
                {
                    engine.sendCommand = function (cmd)
                    {
                        ///NOTE: The single-threaded engine needs to specifiy async for "go" commands to prevent memory leaks and other errors.
                        engine.ccall("command", null, ["string"], [cmd], {async: typeof IS_ASYNCIFY !== "undefined" && /^go\b/.test(cmd)});
                    };

                    queue.forEach(engine.sendCommand);
                    queue = null;
                });

                require("readline").createInterface({
                    input: process.stdin,
                    output: process.stdout,
                    historySize: 100,
                }).on("line", function online(line)
                {
                    if (line) {
                        if (engine.sendCommand) {
                            engine.sendCommand(line);
                        } else {
                            queue.push(line);
                        }
                        if (line === "quit" || line === "exit") {
                            process.exit();
                        }
                    }
                }).on("close", function onend()
                {
                    process.exit();
                }).setPrompt("");

            /// Is this a node module?
            } else {
                module.exports = INIT_ENGINE;
            }
        } else {
            (function ()
            {
                var wasmBlob;
                
                function loadBinary(onLoaded)
                {
                    function fetchBinary(path, cb)
                    {
                        fetch(new Request(path)).then(function (response)
                        {
                            return response.blob();
                        }).then(function (wasmData)
                        {
                            cb(wasmData);
                        });
                    }
                    function loadParts(total)
                    {
                        var doneCount = 0;
                        var i;
                        var parts = [];
                        var ext = wasmPath.slice((wasmPath.lastIndexOf(".") - 1 >>> 0) + 1);
                        var basename = wasmPath.slice(0, -ext.length);
                        
                        function createOnDownload(num)
                        {
                            return function onDownload(data)
                            {
                                var wasmBlob;
                                ++doneCount;
                                parts[num] = data;
                                if (doneCount === total) {
                                    wasmBlob = URL.createObjectURL(new Blob(parts));
                                    onLoaded(wasmBlob);
                                }
                            };
                        }
                        for (i = 0; i < total; ++i) {
                            fetchBinary(basename + "-part-" + i + ext, createOnDownload(i));
                        }
                    }
                    if (typeof enginePartsCount === "number") {
                        loadParts(enginePartsCount);
                    } else {
                        onLoaded();
                    }
                }
                
                var args = self.location.hash.substr(1).split(",");
                wasmPath = decodeURIComponent(args[0] || location.origin + location.pathname.replace(/\.js$/i, ".wasm"));
                
                loadBinary(function (wasmBlob)
                {
                    engine = {
                        locateFile: function (path)
                        {
                            if (path.indexOf(".wasm") > -1) {
                                if (path.indexOf(".wasm.map") > -1) {
                                    /// Set the path to the wasm map.
                                    return wasmPath + ".map"
                                }
                                /// Set the path to the wasm binary.
                                return wasmBlob || wasmPath;
                            }
                            /// Set path to worker (self + the worker hash)
                            return self.location.origin + self.location.pathname + "#" + wasmPath + ",worker";
                        },
                        listener: function onMessage(line)
                        {
                            postMessage(line);
                        },
                    }
                    Torch = INIT_ENGINE();
                
                    Torch(engine).then(function checkIfReady()
                    {
                        engine.sendCommand = function (cmd)
                        {
                            ///NOTE: The single-threaded engine needs to specifiy async for "go" commands to prevent memory leaks and other errors.
                            engine.ccall("command", null, ["string"], [cmd], {async: typeof IS_ASYNCIFY !== "undefined" && /^go\b/.test(cmd)});
                            ///NOTE: The engine must be fully initialized before we can close the Pthreads. so we have to check this here, not in onmessage.
                            if (cmd === "quit" || cmd === "exit") {
                                /// Close the Pthreads.
                                try {
                                    engine.terminate();
                                } catch (e) {}
                            }
                        };
                        queue.forEach(engine.sendCommand);
                        queue = null;
                    }).catch(function (e)
                    {
                        /// Sadly, Web Workers will not trigger the error event when errors occur in promises, so we need to create a new context and throw an error there.
                        setTimeout(function throwError()
                        {
                            throw e;
                        }, 1);
                    });
                });
                
                /// Make sure that this is only added once.
                if (!onmessage) {
                    onmessage = function (event)
                    {
                        if (engine.sendCommand) {
                            engine.sendCommand(event.data);
                        } else {
                            queue.push(event.data);
                        }
                        ///NOTE: We check this here, not just in engine.sendCommand, because the engine might never finish loading.
                        if (event.data === "quit" || event.data === "exit") {
                            /// Exit the Web Worker.
                            try {
                                self.close();
                            } catch (e) {}
                        }
                    };
                }
            }());
        }
    }());
} else {
    ///NOTE: If it's a normal browser, the client can use the engine without polluting the global scope.
    if (typeof document === "object" && document.currentScript) {
        document.currentScript._exports = INIT_ENGINE();
    } else {
        Torch = INIT_ENGINE();
    }
}
}());
