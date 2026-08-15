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
  '/photos/harshada-02.jpg',
  '/photos/harshada-04.jpg',
  '/photos/couple-01.jpg',
  '/photos/harshada-05.jpg'
];

function getMode(){ 
  return new URLSearchParams(location.search).get('mode') || 'home'; 
}

function App(){
  const [mode,setMode]=useState(getMode());
  const [notes,setNotes]=useState([]);
  const [notesLoading,setNotesLoading]=useState(true);
  const [assets,setAssets]=useState(()=>JSON.parse(localStorage.getItem('hr_assets')||'[]'));
  const [showAdd,setShowAdd]=useState(false);
  const [selected,setSelected]=useState(null);
  const [celebrate,setCelebrate]=useState(false);
  const [name,setName]=useState('');
  const [message,setMessage]=useState('');
  const [adminUnlocked,setAdminUnlocked]=useState(sessionStorage.getItem('hr_admin')==='1');
  const [password,setPassword]=useState('');

  useEffect(()=>{
    localStorage.setItem('hr_assets',JSON.stringify(assets));
  },[assets]);

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
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'wishes' 
        },
        payload => {
          setNotes(current => {
            if (current.some(n => n.id === payload.new.id)) return current;
            return [payload.new, ...current];
          });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'wishes' 
        },
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
      .insert({
        name: cleanName,
        message: cleanMessage
      })
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
      .