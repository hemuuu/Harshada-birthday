import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Heart, Lock, Plus, Trash2, Upload, X, Sparkles, ArrowLeft, BusFront, Camera} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const SUPABASE_URL = 'https://vxonbwnzdarqmtpdqehr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kF5AqXwDU4taNpaUfk-O_Q_1zqPOdh7';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROOM_PHOTOS = [
  '/photos/harshada-01.jpg',
  '/photos/harshada-02.jpg',
  '/photos/harshada-03.jpg',
  '/photos/harshada-04.jpg',
  '/photos/couple-01.jpg',
  '/photos/harshada-05.jpg'
];

function getMode(){ return new URLSearchParams(location.search).get('mode') || 'home'; }

function App(){
  const [mode,setMode]=useState(getMode());
  const [notes,setNotes]=useState([]);
  const [notesLoading,setNotesLoading]=useState(true);
  const [assets,setAssets]=useState(()=>JSON.parse(localStorage.getItem('hr_assets')||'[]'));
  const [showAdd,setShowAdd]=useState(false), [selected,setSelected]=useState(null), [celebrate,setCelebrate]=useState(false);
  const [name,setName]=useState(''), [message,setMessage]=useState('');
  const [adminUnlocked,setAdminUnlocked]=useState(sessionStorage.getItem('hr_admin')==='1');
  const [password,setPassword]=useState('');

  useEffect(()=>localStorage.setItem('hr_assets',JSON.stringify(assets)),[assets]);

  useEffect(()=>{
    let mounted = true;

    const loadWishes = async () => {
      const { data, error } = await supabase
        .from('wishes')
        .select('id, name, message, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Could not load wishes:', error);
      } else if (mounted) {
        setNotes(data || []);
      }

      if (mounted) setNotesLoading(false);
    };

    loadWishes();

    const channel = supabase
      .channel('wishes-room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wishes' },
        payload => {
          setNotes(current => {
            if (current.some(n => n.id === payload.new.id)) return current;
            return [payload.new, ...current];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'wishes' },
        payload => {
          setNotes(current => current.filter(n => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  },[]);

  useEffect(()=>{
    const fn=()=>setMode(getMode());
    addEventListener('popstate',fn);
    return()=>removeEventListener('popstate',fn);
  },[]);

  const go=m=>{
    history.pushState({},'',`?mode=${m}`);
    setMode(m);
    setSelected(null);
    setCelebrate(false);
    window.scrollTo(0,0);
  };

  const addNote = async e => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if(!cleanName || !cleanMessage) return;

    const { data, error } = await supabase
      .from('wishes')
      .insert({ name: cleanName, message: cleanMessage })
      .select()
      .single();

    if(error){
      console.error('Could not save wish:', error);
      alert('Could not save your wish. Please try again.');
      return;
    }

    setNotes(current => {
      if(current.some(n => n.id === data.id)) return current;
      return [data, ...current];
    });

    setName('');
    setMessage('');
    setShowAdd(false);
  };

  const removeNote = async id => {
    const { error } = await supabase
      .from('wishes')
      .delete()
      .eq('id',id);

    if(error){
      console.error('Could not delete wish:', error);
      alert('Could not delete this wish.');
    }
  };

  const upload=e=>{
    const f=e.target.files?.[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=()=>setAssets([{id:crypto.randomUUID(),url:r.result,caption:f.name},...assets]);
    r.readAsDataURL(f);
  };

  if(mode==='admin') return <Admin notes={notes} removeNote={removeNote} assets={assets} upload={upload} unlocked={adminUnlocked} password={password} setPassword={setPassword} unlock={()=>{if(password==='iluvharshada'){sessionStorage.setItem('hr_admin','1');setAdminUnlocked(true)}}} go={go}/>;
  if(mode==='harshada') return <Harshada notes={notes} assets={assets} selected={selected} setSelected={setSelected} celebrate={celebrate} setCelebrate={setCelebrate} go={go} notesLoading={notesLoading}/>;
  if(mode==='wish') return <Wishers notes={notes} notesLoading={notesLoading} setShowAdd={setShowAdd} showAdd={showAdd} addNote={addNote} name={name} setName={setName} message={message} setMessage={setMessage} go={go}/>;
  return <Home go={go}/>;
}

function Shell({children,go}){return <main className="page"><header><button className="back" onClick={()=>go('home')}><ArrowLeft size={16}/> back</button><div className="tiny-title">HARSHADA'S ROOM <span>♡</span></div></header>{children}</main>}

function Home({go}){return <div className="page home"><div className="stars">✦　✧　⋆</div><div className="hero-copy"><span>WELCOME TO</span><h1>Harshada's Room</h1><p>a tiny pixel room made with a lot of love</p></div><RoomArt/><div className="home-actions"><button onClick={()=>go('wish')}><Plus size={18}/> leave a little wish</button><button onClick={()=>go('harshada')}><Heart size={17}/> Harshada's door</button></div><p className="home-line">“Vihag ev mukt”</p><div className="secret" onClick={()=>go('admin')}>admin corner</div></div>}

function PhotoPolaroid({src,className,label}){return <div className={`photo-polaroid ${className||''}`}><img src={src}/><span>{label}</span></div>}

function RoomArt(){return <div className="room-frame"><div className="room"><div className="wall">
  <div className="sign">HARSHADA'S<br/>ROOM ♡</div>
  <div className="painting"><div className="painting-pixel"><span>र</span></div><small>little pixel painting</small></div>
  <div className="board"><div className="board-title">letters for Harshada</div>{['♡','HBD!','5K','love u','yay!','xoxo','✨','babe','hehe','💗','!!!','you'].map((x,i)=><span key={i} className={'mini-note n'+i}>{x}</span>)}</div>
  <div className="photo-cluster">
    <PhotoPolaroid src={ROOM_PHOTOS[0]} className="ph1" label="you ♡"/>
    <PhotoPolaroid src={ROOM_PHOTOS[4]} className="ph2" label="us"/>
    <PhotoPolaroid src={ROOM_PHOTOS[2]} className="ph3" label="5K"/>
  </div>
  <div className="shelf"><div className="bus-wrap"><MiniBus/></div><div className="tiny-frame">H<br/><span>♡</span></div></div>
</div><div className="floor"><div className="table"><div className="cake">5K<br/><span>♥ ♥ ♥</span></div></div><div className="chair c1"/><div className="chair c2"/><div className="plant">♧</div><div className="cat">🐈‍⬛</div></div></div></div>}

function MiniBus(){return <div className="mini-bus" title="tiny India bus"><div className="bus-roof">INDIA</div><div className="bus-body"><span className="bus-window w1"/><span className="bus-window w2"/><span className="bus-window w3"/><span className="bus-window w4"/><i className="bus-wheel bw1"/><i className="bus-wheel bw2"/></div><div className="bus-front">▸</div></div>}

function Wishers({notes,notesLoading,setShowAdd,showAdd,addNote,name,setName,message,setMessage,go}){
  const people=[...new Map(notes.map(n=>[n.name,n])).values()];
  return <Shell go={go}>
    <section className="section">
      <p className="eyebrow">YOU'RE IN THE ROOM</p>
      <h2>Leave Harshada<br/><em>a little note.</em></h2>
      <p className="lead">No account. No login. Just your name + something you want her to know.</p>
      <button className="primary" onClick={()=>setShowAdd(true)}><Plus/> Add my note</button>
      <div className="wished">
        <div><b>{people.length}</b><span>people have wished her</span></div>
        <button onClick={()=>document.getElementById('wisher-list').scrollIntoView({behavior:'smooth'})}>see who wished →</button>
      </div>
    </section>
    <div id="wisher-list" className="note-list">
      <h3>Already on the board</h3>
      {notesLoading ? <p>Loading wishes…</p> : notes.length===0 ? <p>No wishes yet — be the first ♡</p> : notes.map(n=><div className="note-card" key={n.id}><span className="tape"/><b>{n.name}</b><p>{n.message}</p></div>)}
    </div>
    {showAdd&&<Modal title="Add your note" close={()=>setShowAdd(false)}>
      <form onSubmit={addNote}>
        <label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Ananya" maxLength={80} autoFocus/></label>
        <label>Your wish<textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write something lovely…" maxLength={1000}/></label>
        <button className="primary" type="submit">Pin it to the board ♡</button>
      </form>
    </Modal>}
  </Shell>
}

function Harshada({notes,assets,selected,setSelected,celebrate,setCelebrate,go,notesLoading}){
  const photos=assets.length?assets.map(a=>a.url):ROOM_PHOTOS;
  return <Shell go={go}>
    <section className="section harshada">
      <p className="eyebrow">A ROOM MADE FOR YOU</p>
      <h2>Happy birthday,<br/><em>babe.</em></h2>
      <p className="lead">There are little pieces of love hidden around this room. Tap a note to read it.</p>
      <button className="primary" onClick={()=>setCelebrate(true)}><Sparkles/> Open all the wishes</button>
    </section>
    <div className="interactive-room">
      <div className="wall">
        <div className="big-sign">HARSHADA<br/><span>♡</span></div>
        <div className="gallery-strip">{photos.slice(0,4).map((src,i)=><img src={src} key={i}/>)}</div>
        <div className="bus-display"><MiniBus/><small>tiny journey<br/>for you</small></div>
        <div className="painting-large"><div className="painting-pixel"><span>र</span></div><small>a little art</small></div>
        {notesLoading ? <p className="sticky s0">Loading wishes…</p> : notes.map((n,i)=><button className={'sticky s'+(i%10)} key={n.id} onClick={()=>setSelected(n)}>{n.message.slice(0,38)}{n.message.length>38?'…':''}<small>— {n.name}</small></button>)}
      </div>
      <div className="floor"><span className="quote">“Vihag ev mukt”</span><span className="floor-cat">🐈‍⬛</span></div>
    </div>
    {selected&&<Modal title={`From ${selected.name} ♡`} close={()=>setSelected(null)}><div className="read-note">{selected.message}</div></Modal>}
    {celebrate&&<Celebration close={()=>setCelebrate(false)} count={notes.length}/>}
  </Shell>
}

function Celebration({close,count}){return <div className="celebrate"><div className="confetti">{Array.from({length:90},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${(i%16)*.08}s`,fontSize:`${12+(i%4)*5}px`}}>{['✦','♡','✧','•'][i%4]}</i>)}</div><div className="celebrate-card"><div className="cake-big">🎂</div><p>for the birthday girl</p><h2>HAPPY<br/>BIRTHDAY<br/><em>BABE ♡</em></h2><span>{count} little wishes are waiting for you</span><button className="primary" onClick={close}>Let me read them →</button></div></div>}

function Admin({notes,removeNote,assets,upload,unlocked,password,setPassword,unlock,go}){
  if(!unlocked)return <div className="admin-login"><Lock size={28}/><p>Harshada's Room · Admin</p><h2>Enter the secret key</h2><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" onKeyDown={e=>e.key==='Enter'&&unlock()}/><button className="primary" onClick={unlock}>Unlock</button><button className="plain" onClick={()=>go('home')}>← back to room</button></div>;
  return <Shell go={go}><div className="admin"><div><p className="eyebrow">PRIVATE CONTROL ROOM</p><h2>Harshada's Room<br/><em>Admin</em></h2></div><label className="upload"><Upload size={18}/> Add room photo<input type="file" accept="image/*" onChange={upload}/></label><p className="admin-tip"><Camera size={14}/> Uploading here adds a photo to Harshada's room. The included starter photos are already pinned in the room.</p><div className="admin-grid"><div><h3>Wishes · {notes.length}</h3>{notes.map(n=><div className="admin-note" key={n.id}><div><b>{n.name}</b><p>{n.message}</p></div><button onClick={()=>removeNote(n.id)} aria-label={`Delete ${n.name}'s note`}><Trash2 size={16}/></button></div>)}</div><div><h3>Uploaded memories · {assets.length}</h3><div className="asset-grid">{assets.map(a=><img src={a.url} key={a.id}/>)}</div></div></div></div></Shell>
}

function Modal({title,close,children}){return <div className="modal-back" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><p className="eyebrow">A LITTLE NOTE</p><h3>{title}</h3>{children}</div></div>}

createRoot(document.getElementById('root')).render(<App/>);
