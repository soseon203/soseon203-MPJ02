// ================================================================
//  사운드 엔진 (Web Audio API - 고품질)
// ================================================================
class SFX {
  constructor(){this.ctx=null;this.muted=false;this.ready=false;this.master=null;this._mp3Buffers={};this._mp3Audio={}}
  init(){
    if(this.ready)return;
    try{
      this.ctx=new(window.AudioContext||window.webkitAudioContext)();
      this.master=this.ctx.createGain();
      this.master.gain.value=0.4;
      this.comp=this.ctx.createDynamicsCompressor();
      this.comp.threshold.value=-20;this.comp.ratio.value=4;
      this.master.connect(this.comp);
      this.comp.connect(this.ctx.destination);
      this.ready=true;
      this._loadZap();
    }catch(e){}
  }
  _loadZap(){
    if(this.zapBuffer)return;
    // XHR 방식 (file:// 프로토콜 호환)
    try{
      const xhr=new XMLHttpRequest();
      xhr.open('GET','sounds/zap.wav',true);
      xhr.responseType='arraybuffer';
      xhr.onload=()=>{
        if(xhr.response){
          this.ctx.decodeAudioData(xhr.response)
            .then(decoded=>{this.zapBuffer=decoded})
            .catch(()=>{this._loadZapAudio()});
        }
      };
      xhr.onerror=()=>{this._loadZapAudio()};
      xhr.send();
    }catch(e){this._loadZapAudio()}
  }
  _loadZapAudio(){
    // Audio element 폴백 (file:// 최종 안전장치)
    if(this._zapAudio)return;
    this._zapAudio=new Audio('sounds/zap.wav');
    this._zapAudio.load();
  }
  _loadMp3(key,path){
    try{
      const xhr=new XMLHttpRequest();
      xhr.open('GET',path,true);
      xhr.responseType='arraybuffer';
      xhr.onload=()=>{
        if(xhr.response){
          this.ctx.decodeAudioData(xhr.response)
            .then(buf=>{this._mp3Buffers[key]=buf})
            .catch(()=>{this._mp3Audio[key]=new Audio(path);this._mp3Audio[key].load()});
        }
      };
      xhr.onerror=()=>{this._mp3Audio[key]=new Audio(path);this._mp3Audio[key].load()};
      xhr.send();
    }catch(e){this._mp3Audio[key]=new Audio(path);this._mp3Audio[key].load()}
  }
  _playMp3(key,vol=0.5,rate=1){
    if(!this.ready||this.muted)return false;
    if(this._mp3Buffers[key]){
      const src=this.ctx.createBufferSource();
      src.buffer=this._mp3Buffers[key];
      src.playbackRate.value=rate;
      const g=this._gain(vol);
      src.connect(g);g.connect(this.master);
      src.start(this.ctx.currentTime);
      return true;
    }else if(this._mp3Audio[key]){
      const clone=this._mp3Audio[key].cloneNode();
      clone.volume=this.muted?0:Math.min(vol,1);
      clone.playbackRate=rate;
      clone.play().catch(()=>{});
      return true;
    }
    return false;
  }
  resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume()}
  toggle(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:0.4;return!this.muted}

  _noise(dur, decay=2){
    const n=this.ctx.sampleRate*dur;
    const buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);
    const src=this.ctx.createBufferSource();src.buffer=buf;return src;
  }
  _osc(type,freq){const o=this.ctx.createOscillator();o.type=type;o.frequency.value=freq;return o}
  _gain(v){const g=this.ctx.createGain();g.gain.value=v;return g}
  _filter(type,freq,q){const f=this.ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;return f}

  zap(power=1){
    if(!this.ready||this.muted)return;
    if(this.zapBuffer){
      const src=this.ctx.createBufferSource();
      src.buffer=this.zapBuffer;
      src.playbackRate.value=0.9+Math.random()*0.2;
      const vol=Math.min(power,3)*0.15+0.25;
      const g=this._gain(vol);
      src.connect(g);g.connect(this.master);
      src.start(this.ctx.currentTime);
    }else if(this._zapAudio){
      // Audio element 폴백 재생
      const clone=this._zapAudio.cloneNode();
      clone.volume=this.muted?0:Math.min(Math.min(power,3)*0.15+0.25,1);
      clone.playbackRate=0.9+Math.random()*0.2;
      clone.play().catch(()=>{});
    }else{
      // 최종 폴백: 합성 사운드
      const t=this.ctx.currentTime;
      const vol=Math.min(power,3)*0.25+0.3;
      const crack=this._noise(0.03,4);
      const crackHi=this._filter('highpass',3000+Math.random()*2000);
      const crackG=this._gain(0);
      crackG.gain.setValueAtTime(vol*1.2,t);
      crackG.gain.exponentialRampToValueAtTime(0.001,t+0.03);
      crack.connect(crackHi);crackHi.connect(crackG);crackG.connect(this.master);
      crack.start(t);crack.stop(t+0.03);
      const o=this._osc('sawtooth',1500+Math.random()*800);
      o.frequency.exponentialRampToValueAtTime(200,t+0.08);
      const oG=this._gain(0);
      oG.gain.setValueAtTime(vol*0.3,t);
      oG.gain.exponentialRampToValueAtTime(0.001,t+0.08);
      o.connect(oG);oG.connect(this.master);
      o.start(t);o.stop(t+0.09);
    }
  }

  explode(size=1){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    const vol=Math.min(size,2)*0.3+0.2;
    const n=this._noise(0.25,1.5);
    const lp=this._filter('lowpass',3000);
    lp.frequency.exponentialRampToValueAtTime(150,t+0.2);
    const g=this._gain(0);
    g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
    n.connect(lp);lp.connect(g);g.connect(this.master);
    n.start(t);n.stop(t+0.25);
    const boom=this._osc('sine',80*size);
    boom.frequency.exponentialRampToValueAtTime(20,t+0.2);
    const bG=this._gain(0);
    bG.gain.setValueAtTime(vol*0.8,t);
    bG.gain.exponentialRampToValueAtTime(0.001,t+0.2);
    boom.connect(bG);bG.connect(this.master);
    boom.start(t);boom.stop(t+0.22);
  }

  chain(){
    if(!this.ready||this.muted)return;
    if(this._playMp3('chain',0.45,0.9+Math.random()*0.2))return;
    // 폴백: 합성 사운드
    const t=this.ctx.currentTime;
    const crack=this._noise(0.04,6);
    const crackBP=this._filter('bandpass',4000+Math.random()*2000,3);
    const crackG=this._gain(0);
    crackG.gain.setValueAtTime(0.3,t);
    crackG.gain.exponentialRampToValueAtTime(0.001,t+0.04);
    crack.connect(crackBP);crackBP.connect(crackG);crackG.connect(this.master);
    crack.start(t);crack.stop(t+0.05);
    const arc=this._osc('sawtooth',3000+Math.random()*1000);
    arc.frequency.exponentialRampToValueAtTime(400,t+0.08);
    const arcRes=this._filter('bandpass',2000,5);
    arcRes.frequency.exponentialRampToValueAtTime(800,t+0.08);
    const arcG=this._gain(0);
    arcG.gain.setValueAtTime(0.18,t);
    arcG.gain.exponentialRampToValueAtTime(0.001,t+0.09);
    arc.connect(arcRes);arcRes.connect(arcG);arcG.connect(this.master);
    arc.start(t);arc.stop(t+0.1);
    const d=0.03+Math.random()*0.02;
    const arc2=this._osc('square',2200+Math.random()*800);
    arc2.frequency.exponentialRampToValueAtTime(500,t+d+0.06);
    const arc2HP=this._filter('highpass',1200);
    const arc2G=this._gain(0);
    arc2G.gain.setValueAtTime(0,t);
    arc2G.gain.setValueAtTime(0.12,t+d);
    arc2G.gain.exponentialRampToValueAtTime(0.001,t+d+0.06);
    arc2.connect(arc2HP);arc2HP.connect(arc2G);arc2G.connect(this.master);
    arc2.start(t);arc2.stop(t+d+0.07);
    const sub=this._osc('sine',120);
    sub.frequency.exponentialRampToValueAtTime(60,t+0.1);
    const subG=this._gain(0);
    subG.gain.setValueAtTime(0.1,t);
    subG.gain.exponentialRampToValueAtTime(0.001,t+0.1);
    sub.connect(subG);subG.connect(this.master);
    sub.start(t);sub.stop(t+0.12);
  }

  upgrade(){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    [880,1108,1320].forEach((f,i)=>{
      const o=this._osc('sine',f);
      const g=this._gain(0);
      const s=t+i*0.05;
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.2,s+0.02);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.25);
      o.connect(g);g.connect(this.master);o.start(s);o.stop(s+0.3);
    });
  }

  waveStart(){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    const o=this._osc('sawtooth',220);
    const lp=this._filter('lowpass',800);
    const g=this._gain(0);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3,t+0.1);
    g.gain.setValueAtTime(0.3,t+0.3);g.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    o.connect(lp);lp.connect(g);g.connect(this.master);
    o.start(t);o.stop(t+0.55);
    const o2=this._osc('sawtooth',330);
    const g2=this._gain(0);
    g2.gain.setValueAtTime(0,t+0.15);g2.gain.linearRampToValueAtTime(0.2,t+0.25);
    g2.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    o2.connect(lp);lp.connect(g2);g2.connect(this.master);
    o2.start(t+0.15);o2.stop(t+0.55);
  }

  waveClear(){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    [523.25,659.25,783.99,1046.5].forEach((f,i)=>{
      const o=this._osc('triangle',f);
      const g=this._gain(0);
      const s=t+i*0.08;
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.2,s+0.03);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.5);
      o.connect(g);g.connect(this.master);o.start(s);o.stop(s+0.55);
    });
  }

  evolution(){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    const crash=this._noise(0.8,1.2);
    const lp=this._filter('lowpass',6000);
    lp.frequency.exponentialRampToValueAtTime(200,t+0.8);
    const cg=this._gain(0);
    cg.gain.setValueAtTime(0.5,t);cg.gain.exponentialRampToValueAtTime(0.001,t+0.8);
    crash.connect(lp);lp.connect(cg);cg.connect(this.master);
    crash.start(t);crash.stop(t+0.8);
    [261.63,329.63,392,523.25,659.25,783.99].forEach((f,i)=>{
      const o=this._osc('triangle',f);
      const g=this._gain(0);
      const s=t+i*0.07;
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.2,s+0.04);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.7);
      o.connect(g);g.connect(this.master);o.start(s);o.stop(s+0.75);
    });
  }

  hit(){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    const o=this._osc('square',200);
    o.frequency.exponentialRampToValueAtTime(80,t+0.1);
    const g=this._gain(0);
    g.gain.setValueAtTime(0.3,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
    const lp=this._filter('lowpass',500);
    o.connect(lp);lp.connect(g);g.connect(this.master);
    o.start(t);o.stop(t+0.13);
  }

  bossAlert(){
    if(!this.ready||this.muted)return;
    if(this._playMp3('bossAlert',0.6))return;
    // 폴백: 합성 사운드
    const t=this.ctx.currentTime;
    for(let i=0;i<3;i++){
      const o=this._osc('sawtooth',110);
      const lp=this._filter('lowpass',400);
      const g=this._gain(0);
      const s=t+i*0.25;
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.35,s+0.05);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.2);
      o.connect(lp);lp.connect(g);g.connect(this.master);
      o.start(s);o.stop(s+0.22);
    }
  }

  gameOver(){
    if(!this.ready||this.muted)return;const t=this.ctx.currentTime;
    [440,349.23,293.66,220].forEach((f,i)=>{
      const o=this._osc('triangle',f);
      const g=this._gain(0);
      const s=t+i*0.2;
      g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(0.25,s+0.05);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.5);
      o.connect(g);g.connect(this.master);o.start(s);o.stop(s+0.55);
    });
  }
}
const sfx=new SFX();
