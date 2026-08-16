import React, { useEffect, useState } from 'react';
import {
  Heart,
  Lock,
  Plus,
  Trash2,
  Upload,
  X,
  Sparkles,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const SUPABASE_URL =
  'https://vxonbwnzdarqmtpdqehr.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_kF5AqXwDU4taNpaUfk-O_Q_1zqPOdh7';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const ROOM_PHOTOS = [
  '/photos/harshada-01.jpg',
  '/photos/harshada-02.jpg',
  '/photos/harshada-04.jpg',
  '/photos/couple-01.jpg',
  '/photos/harshada-05.jpg'
];

function getMode() {
  return (
    new URLSearchParams(location.search).get('mode') ||
    'home'
  );
}

function App() {
  const [mode, setMode] = useState(getMode());
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  const [assets, setAssets] = useState(
    () =>
      JSON.parse(
        localStorage.getItem('hr_assets') || '[]'
      )
  );

  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const [adminUnlocked, setAdminUnlocked] =
    useState(
      sessionStorage.getItem('hr_admin') === '1'
    );

  const [password, setPassword] = useState('');

  useEffect(() => {
    localStorage.setItem(
      'hr_assets',
      JSON.stringify(assets)
    );
  }, [assets]);

  /*
   * SUPABASE / BACKEND
   */
  useEffect(() => {
    let mounted = true;

    const loadWishes = async () => {
      const { data, error } =
        await supabase
          .from('wishes')
          .select(
            'id, name, message, created_at'
          )
          .order(
            'created_at',
            { ascending: false }
          );

      if (error) {
        console.error(
          'Could not load wishes:',
          error
        );
      } else if (mounted) {
        setNotes(data || []);
      }

      if (mounted) {
        setNotesLoading(false);
      }
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
            if (
              current.some(
                n => n.id === payload.new.id
              )
            ) {
              return current;
            }

            return [
              payload.new,
              ...current
            ];
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
          setNotes(
            current =>
              current.filter(
                n => n.id !== payload.old.id
              )
          );
        }
      )

      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fn = () => {
      setMode(getMode());
    };

    addEventListener('popstate', fn);

    return () => {
      removeEventListener('popstate', fn);
    };
  }, []);

  const go = m => {
    history.pushState(
      {},
      '',
      `?mode=${m}`
    );

    setMode(m);
    setSelected(null);
    setCelebrate(false);

    window.scrollTo(0, 0);
  };

  /*
   * SUPABASE / BACKEND
   */
  const addNote = async e => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (
      !cleanName ||
      !cleanMessage
    ) {
      return;
    }

    const { data, error } =
      await supabase
        .from('wishes')
        .insert({
          name: cleanName,
          message: cleanMessage
        })
        .select()
        .single();

    if (error) {
      console.error(
        'Could not save wish:',
        error
      );

      alert(
        'Could not save your wish. Please try again.'
      );

      return;
    }

    setNotes(current => {
      if (
        current.some(
          n => n.id === data.id
        )
      ) {
        return current;
      }

      return [
        data,
        ...current
      ];
    });

    setName('');
    setMessage('');
    setShowAdd(false);
  };

  /*
   * SUPABASE / BACKEND
   */
  const removeNote = async id => {
    const { error } =
      await supabase
        .from('wishes')
        .delete()
        .eq('id', id);

    if (error) {
      console.error(
        'Could not delete wish:',
        error
      );

      alert(
        'Could not delete this wish.'
      );
    }
  };

  const upload = e => {
    const f =
      e.target.files?.[0];

    if (!f) {
      return;
    }

    const r =
      new FileReader();

    r.onload = () => {
      setAssets([
        {
          id: crypto.randomUUID(),
          url: r.result,
          caption: f.name
        },
        ...assets
      ]);
    };

    r.readAsDataURL(f);
  };

  if (mode === 'admin') {
    return (
      <Admin
        notes={notes}
        removeNote={removeNote}
        assets={assets}
        upload={upload}
        unlocked={adminUnlocked}
        password={password}
        setPassword={setPassword}
        unlock={() => {
          if (
            password === 'iluvharshada'
          ) {
            sessionStorage.setItem(
              'hr_admin',
              '1'
            );

            setAdminUnlocked(true);
          }
        }}
        go={go}
      />
    );
  }

  if (mode === 'harshada') {
    return (
      <Harshada
        notes={notes}
        assets={assets}
        selected={selected}
        setSelected={setSelected}
        celebrate={celebrate}
        setCelebrate={setCelebrate}
        notesLoading={notesLoading}
      />
    );
  }

  if (mode === 'wish') {
    return (
      <Wishers
        notes={notes}
        notesLoading={notesLoading}
        setShowAdd={setShowAdd}
        showAdd={showAdd}
        addNote={addNote}
        name={name}
        setName={setName}
        message={message}
        setMessage={setMessage}
      />
    );
  }

  return (
    <Home
      go={go}
      notes={notes}
      notesLoading={notesLoading}
    />
  );
}


/*
 * SHELL
 */
function Shell({
  children,
  go,
  showBack = true
}) {
  return (
    <main className="page">

      <header>

        {showBack ? (
          <button
            className="back"
            onClick={() => go('home')}
          >
            <ArrowLeft size={16} />
            back
          </button>
        ) : (
          <div />
        )}

        <div className="tiny-title">
          HARSHADA'S ROOM
          <span>♡</span>
        </div>

      </header>

      {children}

    </main>
  );
}


/*
 * HOME
 */
function Home({
  go,
  notes,
  notesLoading
}) {
  return (
    <div className="page home">

      <div className="stars">
        ✦　✧　⋆
      </div>

      <div className="hero-copy">

        <span>
          WELCOME TO
        </span>

        <h1>
          Harshada's Room
        </h1>

        <p>
          a tiny pixel room made with a lot of love
        </p>

      </div>

      <RoomArt
        notes={notes}
        notesLoading={notesLoading}
      />

      <div className="home-actions">

        <button
          onClick={() => go('wish')}
        >
          <Plus size={18} />
          leave a little wish
        </button>

        <button
          onClick={() => go('harshada')}
        >
          <Heart size={17} />
          Harshada's door
        </button>

      </div>

      <div
        className="secret"
        onClick={() => go('admin')}
      >
        admin corner
      </div>

    </div>
  );
}


/*
 * POLAROID
 */
function PhotoPolaroid({
  src,
  className,
  label
}) {
  return (
    <div
      className={
        `photo-polaroid ${
          className || ''
        }`
      }
    >
      <img
        src={src}
        alt=""
      />

      <span>
        {label}
      </span>
    </div>
  );
}


/*
 * SHARED ROOM VIEW
 */
function RoomArt({
  notes = [],
  notesLoading = false,
  hideTable = false
}) {

  const [balloons, setBalloons] =
    useState([
      {
        id: 1,
        x: '8%',
        y: '12%',
        rotate: '-8deg'
      },
      {
        id: 2,
        x: '20%',
        y: '5%',
        rotate: '6deg'
      },
      {
        id: 3,
        x: '77%',
        y: '8%',
        rotate: '-5deg'
      },
      {
        id: 4,
        x: '87%',
        y: '19%',
        rotate: '8deg'
      },
      {
        id: 5,
        x: '91%',
        y: '42%',
        rotate: '-6deg'
      }
    ]);

  const [bursting, setBursting] =
    useState(null);

  const [rabbitFloat, setRabbitFloat] =
    useState(false);

  useEffect(() => {

    const interval =
      setInterval(() => {

        setRabbitFloat(
          current => !current
        );

      }, 1200);

    return () => {
      clearInterval(interval);
    };

  }, []);

  const popBalloon = id => {

    if (bursting !== null) {
      return;
    }

    setBursting(id);

    setTimeout(() => {

      setBalloons(
        current =>
          current.filter(
            balloon =>
              balloon.id !== id
          )
      );

      setBursting(null);

    }, 450);
  };


  /*
   * ALL NOTES.
   * No limit.
   */
  const boardNotes = notes;


  return (
    <>

      <style>{`

        /*
         * HARSHADA ONLY
         */
        .harshada-room .table {
          display: none !important;
        }


        /*
         * TOP ROOM BOARD
         */
        .board.dynamic-board {

          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(70px, 1fr)
            );

          gap: 8px;

          align-items: start;

          align-content: start;

          overflow-y: auto;

          overflow-x: hidden;

          max-height: 420px;

          padding: 10px;

          box-sizing: border-box;

        }

        .board.dynamic-board
        .board-title {
          grid-column: 1 / -1;
        }

        .dynamic-mini-note {

          position: relative !important;

          inset: auto !important;

          width: auto;

          min-width: 0;

          min-height: 38px;

          display: flex;

          align-items: center;

          justify-content: center;

          text-align: center;

          padding: 7px 5px;

          box-sizing: border-box;

          overflow: hidden;

          word-break: break-word;

          line-height: 1.05;

          transform:
            rotate(
              var(--note-rotation)
            ) !important;

        }

        .dynamic-mini-note:hover {

          transform:
            rotate(0deg)
            scale(1.06) !important;

          z-index: 20;

        }


        /*
         * LOWER HARSHADA SECTION
         *
         * IMPORTANT:
         * force the room/board to grow naturally.
         */
        .interactive-room {

          height: auto !important;

          min-height: 0 !important;

          overflow: visible !important;

        }


        .interactive-room > .wall {

          height: auto !important;

          min-height: 0 !important;

          overflow: visible !important;

          position: relative !important;

          display: flex !important;

          flex-direction: column !important;

        }


        /*
         * Keep the Harshada title visible.
         */
        .interactive-room .big-sign {

          position: relative !important;

          z-index: 30 !important;

          flex-shrink: 0 !important;

        }


        /*
         * Keep polaroids above the note grid.
         *
         * They remain in their own visual layer
         * and cannot be covered by notes.
         */
        .interactive-room .gallery-strip {

          position: relative !important;

          z-index: 50 !important;

          flex-shrink: 0 !important;

          isolation: isolate;

        }


        /*
         * Dynamic lower note board.
         *
         * It is now a normal-flow grid.
         * Therefore the parent grows with it.
         */
        .harshada-note-grid {

          position: relative !important;

          z-index: 10 !important;

          display: grid !important;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(145px, 1fr)
            );

          gap: 18px;

          width: 100% !important;

          height: auto !important;

          min-height: 0 !important;

          max-height: none !important;

          overflow: visible !important;

          box-sizing: border-box;

          padding: 24px;

          margin: 0 !important;

          clear: both;

          align-items: start;

        }


        /*
         * Every sticky is now part of normal
         * document flow.
         */
        .harshada-note-grid
        .sticky.dynamic-sticky {

          position: relative !important;

          inset: auto !important;

          left: auto !important;

          right: auto !important;

          top: auto !important;

          bottom: auto !important;

          width: auto !important;

          min-width: 0 !important;

          min-height: 120px;

          height: auto !important;

          margin: 0 !important;

          box-sizing: border-box;

          display: flex;

          flex-direction: column;

          justify-content: center;

          align-items: center;

          text-align: center;

          overflow: visible !important;

          transform:
            rotate(
              var(--sticky-rotation)
            ) !important;

          z-index: 10;

        }


        .harshada-note-grid
        .sticky.dynamic-sticky:hover {

          transform:
            rotate(0deg)
            scale(1.04) !important;

          z-index: 100 !important;

        }


        /*
         * Make sure the lower floor follows
         * the expanded note board.
         */
        .interactive-room > .floor {

          height: 160px !important;

          min-height: 160px !important;

          position: relative !important;

          clear: both;

        }


        @media (max-width: 600px) {

          .harshada-note-grid {

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 12px;

            padding: 14px;

          }

          .harshada-note-grid
          .sticky.dynamic-sticky {

            min-height: 105px;

          }

        }


        /*
         * RABBIT
         */
        .room-rabbit {

          transition:
            transform 1.2s ease-in-out,
            filter 1.2s ease-in-out;

          transform:
            translateY(
              ${rabbitFloat ? '-5px' : '0px'}
            )
            rotate(
              ${rabbitFloat ? '1deg' : '-1deg'}
            );

          filter:
            drop-shadow(
              2px 3px 0
              rgba(50,30,20,.25)
            );

        }


        /*
         * BALLOONS
         */
        .room-balloon {

          position: absolute;

          width: 34px;

          height: 42px;

          border-radius:
            50% 50% 47% 47%;

          border:
            2px solid #49352e;

          cursor: pointer;

          z-index: 8;

          padding: 0;

          transition:
            transform .25s ease,
            opacity .25s ease;

          animation:
            balloonFloat
            3s
            ease-in-out
            infinite;

          box-shadow:
            inset -5px -5px 0
            rgba(0,0,0,.08);

        }


        .room-balloon::before {

          content: '';

          position: absolute;

          width: 7px;

          height: 7px;

          left: 50%;

          bottom: -4px;

          transform:
            translateX(-50%)
            rotate(45deg);

          background: inherit;

          border-right:
            2px solid #49352e;

          border-bottom:
            2px solid #49352e;

        }


        .room-balloon::after {

          content: '';

          position: absolute;

          width: 1px;

          height: 34px;

          left: 50%;

          top: 100%;

          background: #49352e;

          opacity: .75;

        }


        .room-balloon:hover {

          transform:
            scale(1.08)
            rotate(3deg);

        }


        .room-balloon.bursting {

          animation:
            balloonBurst
            .45s
            ease-out
            forwards;

          pointer-events: none;

        }


        @keyframes balloonFloat {

          0%,
          100% {
            margin-top: 0;
          }

          50% {
            margin-top: -7px;
          }

        }


        @keyframes balloonBurst {

          0% {
            transform: scale(1);
            opacity: 1;
          }

          45% {
            transform: scale(1.35);
            opacity: 1;
          }

          100% {
            transform: scale(0);
            opacity: 0;
          }

        }


        .balloon-burst {

          position: absolute;

          width: 42px;

          height: 42px;

          z-index: 9;

          pointer-events: none;

          animation:
            burstFade
            .45s
            ease-out
            forwards;

        }


        .balloon-burst span {

          position: absolute;

          left: 50%;

          top: 50%;

          font-family: 'VT323';

          font-size: 16px;

          animation:
            burstParticle
            .45s
            ease-out
            forwards;

        }


        .balloon-burst span:nth-child(1) {

          transform:
            translate(-50%,-50%)
            translate(-18px,-15px);

        }

        .balloon-burst span:nth-child(2) {

          transform:
            translate(-50%,-50%)
            translate(18px,-14px);

        }

        .balloon-burst span:nth-child(3) {

          transform:
            translate(-50%,-50%)
            translate(-20px,12px);

        }

        .balloon-burst span:nth-child(4) {

          transform:
            translate(-50%,-50%)
            translate(20px,12px);

        }


        @keyframes burstParticle {

          0% {
            opacity: 1;
            scale: 1;
          }

          100% {
            opacity: 0;
            scale: .4;
          }

        }


        @keyframes burstFade {

          from {
            opacity: 1;
          }

          to {
            opacity: 0;
          }

        }

      `}</style>


      <div
        className={
          `room-frame ${
            hideTable
              ? 'harshada-room'
              : ''
          }`
        }
      >

        <div className="room">

          <div className="wall">


            {/* BALLOONS */}

            {balloons.map(
              (balloon, index) => {

                const balloonColors = [
                  '#f28eae',
                  '#f4d77d',
                  '#9fcbd0',
                  '#d9a3bd',
                  '#a9c8a7'
                ];

                const color =
                  balloonColors[
                    index %
                    balloonColors.length
                  ];

                return (

                  <React.Fragment
                    key={balloon.id}
                  >

                    <button
                      type="button"

                      className={
                        'room-balloon ' +
                        (
                          bursting ===
                          balloon.id
                            ? 'bursting'
                            : ''
                        )
                      }

                      onClick={() =>
                        popBalloon(
                          balloon.id
                        )
                      }

                      aria-label="Pop balloon"

                      style={{
                        left: balloon.x,
                        top: balloon.y,
                        background: color,
                        transform:
                          `rotate(${balloon.rotate})`
                      }}

                    />


                    {bursting ===
                      balloon.id && (

                      <div
                        className="balloon-burst"

                        style={{
                          left: balloon.x,
                          top: balloon.y
                        }}
                      >

                        <span>✦</span>
                        <span>♡</span>
                        <span>✧</span>
                        <span>•</span>

                      </div>

                    )}

                  </React.Fragment>

                );

              }
            )}


            {/* ROOM SIGN */}

            <div className="sign">

              HARSHADA'S
              <br />
              ROOM ♡

            </div>


            {/* TOP DYNAMIC WISH BOARD */}

            <div
              className="board dynamic-board"
            >

              <div className="board-title">

                letters for Harshada

              </div>


              {notesLoading ? (

                <span className="mini-note n0">
                  loading…
                </span>

              ) : boardNotes.length === 0 ? (

                <span className="mini-note n0">
                  no wishes yet ♡
                </span>

              ) : (

                boardNotes.map(
                  (note, index) => {

                    const text =
                      note.message.length > 42
                        ? note.message.slice(
                            0,
                            42
                          ) + '…'
                        : note.message;

                    const rotations = [
                      '-2deg',
                      '2deg',
                      '-1deg',
                      '1deg',
                      '-3deg',
                      '3deg'
                    ];

                    return (

                      <span
                        key={note.id}

                        className={
                          'mini-note ' +
                          'dynamic-mini-note'
                        }

                        style={{
                          '--note-rotation':
                            rotations[
                              index %
                              rotations.length
                            ]
                        }}

                        title={
                          `${note.name}: ${note.message}`
                        }
                      >

                        {text}

                      </span>

                    );

                  }
                )

              )}

            </div>


            {/* PHOTOS */}

            <div className="photo-cluster">

              <PhotoPolaroid
                src={ROOM_PHOTOS[0]}
                className="ph1"
                label="you ♡"
              />

              <PhotoPolaroid
                src={ROOM_PHOTOS[4]}
                className="ph2"
                label="us"
              />

              <PhotoPolaroid
                src={ROOM_PHOTOS[2]}
                className="ph3"
                label="♡"
              />

            </div>


            {/* SHELF */}

            <div className="shelf">

              <div className="tiny-frame">

                H
                <br />

                <span>
                  ♡
                </span>

              </div>

            </div>

          </div>


          {/* FLOOR */}

          <div className="floor">

            <div className="table" />

            <div className="chair c1" />

            <div className="chair c2" />

            <div className="plant">
              ♧
            </div>

            <div
              className="cat room-rabbit"
              aria-label="little white rabbit"
            >
              🐇
            </div>

          </div>

        </div>

      </div>

    </>
  );
}


/*
 * WISHERS
 */
function Wishers({
  notes,
  notesLoading,
  setShowAdd,
  showAdd,
  addNote,
  name,
  setName,
  message,
  setMessage
}) {

  const people = [
    ...new Map(
      notes.map(
        n => [n.name, n]
      )
    ).values()
  ];

  return (

    <Shell
      showBack={false}
    >

      <section className="section">

        <p className="eyebrow">
          YOU'RE IN THE ROOM
        </p>

        <h2>
          Leave Harshada
          <br />
          <em>
            a little note.
          </em>
        </h2>

        <p className="lead">
          No account. No login. Just your name +
          something you want her to know.
        </p>

        <button
          className="primary"
          onClick={() =>
            setShowAdd(true)
          }
        >
          <Plus />
          Add my note
        </button>

        <div className="wished">

          <div>

            <b>
              {people.length}
            </b>

            <span>
              people have wished her
            </span>

          </div>

          <button
            onClick={() => {

              document
                .getElementById(
                  'wisher-list'
                )
                ?.scrollIntoView({
                  behavior: 'smooth'
                });

            }}
          >
            see who wished →
          </button>

        </div>

      </section>


      <RoomArt
        notes={notes}
        notesLoading={notesLoading}
      />


      <div
        id="wisher-list"
        className="note-list"
      >

        <h3>
          Already on the board
        </h3>

        {notesLoading ? (

          <p>
            Loading wishes…
          </p>

        ) : notes.length === 0 ? (

          <p>
            No wishes yet — be the first ♡
          </p>

        ) : (

          notes.map(
            n => (

              <div
                className="note-card"
                key={n.id}
              >

                <span className="tape" />

                <b>
                  {n.name}
                </b>

                <p>
                  {n.message}
                </p>

              </div>

            )
          )

        )}

      </div>


      {showAdd && (

        <Modal
          title="Add your note"
          close={() =>
            setShowAdd(false)
          }
        >

          <form
            onSubmit={addNote}
          >

            <label>

              Your name

              <input
                value={name}
                onChange={e =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="e.g. Ananya"
                maxLength={80}
                autoFocus
              />

            </label>


            <label>

              Your wish

              <textarea
                value={message}
                onChange={e =>
                  setMessage(
                    e.target.value
                  )
                }
                placeholder="Write something lovely…"
                maxLength={1000}
              />

            </label>


            <button
              className="primary"
              type="submit"
            >
              Pin it to the board ♡
            </button>

          </form>

        </Modal>

      )}

    </Shell>

  );
}


/*
 * HARSHADA MODE
 */
function Harshada({
  notes,
  assets,
  selected,
  setSelected,
  celebrate,
  setCelebrate,
  notesLoading
}) {

  useEffect(() => {
    setCelebrate(true);
  }, []);

  const photos =
    assets.length
      ? assets.map(
          a => a.url
        )
      : ROOM_PHOTOS;


  const stickyRotations = [
    '-3deg',
    '2deg',
    '-1deg',
    '3deg',
    '-2deg',
    '1deg'
  ];


  return (

    <Shell
      showBack={false}
    >

      {/* INTRO */}

      <section
        className="section harshada"
      >

        <p className="eyebrow">
          A ROOM MADE FOR YOU
        </p>

        <h2>
          Happy birthday,
          <br />
          <em>
            babe.
          </em>
        </h2>

        <p className="lead">
          There are little pieces of love hidden
          around this room. Tap a note to read it.
        </p>

        <button
          className="primary"
          onClick={() =>
            setCelebrate(true)
          }
        >
          <Sparkles />
          Open all the wishes
        </button>

      </section>


      {/* MAIN ROOM */}

      <RoomArt
        notes={notes}
        notesLoading={notesLoading}
        hideTable={true}
      />


      {/* LOWER HARSHADA SECTION */}

      <div className="interactive-room">

        <div className="wall">


          <div className="big-sign">

            HARSHADA

            <br />

            <span>
              ♡
            </span>

          </div>


          {/*
           * POLAROIDS ARE KEPT OUTSIDE
           * THE NOTE GRID AND ABOVE IT.
           */}
          <div className="gallery-strip">

            {photos
              .slice(0, 4)
              .map(
                (src, i) => (

                  <img
                    src={src}
                    key={i}
                    alt=""
                  />

                )
              )
            }

          </div>


          {notesLoading ? (

            <div className="harshada-note-grid">

              <p className="sticky dynamic-sticky">

                Loading wishes…

              </p>

            </div>

          ) : notes.length === 0 ? (

            <div className="harshada-note-grid">

              <p className="sticky dynamic-sticky">

                No wishes yet ♡

              </p>

            </div>

          ) : (

            /*
             * NO LIMIT.
             *
             * Every Supabase note gets
             * its own grid cell.
             */
            <div className="harshada-note-grid">

              {notes.map(
                (n, i) => {

                  const preview =
                    n.message.length > 90
                      ? n.message.slice(
                          0,
                          90
                        ) + '…'
                      : n.message;

                  return (

                    <button
                      key={n.id}

                      className={
                        'sticky ' +
                        'dynamic-sticky'
                      }

                      style={{
                        '--sticky-rotation':
                          stickyRotations[
                            i %
                            stickyRotations.length
                          ]
                      }}

                      onClick={() =>
                        setSelected(n)
                      }
                    >

                      <span>
                        {preview}
                      </span>

                      <small>
                        — {n.name}
                      </small>

                    </button>

                  );

                }
              )}

            </div>

          )}

        </div>


        <div className="floor">

          <span className="floor-cat">
            🐇
          </span>

        </div>

      </div>


      {/* NOTE READER */}

      {selected && (

        <Modal
          title={
            `From ${selected.name} ♡`
          }
          close={() =>
            setSelected(null)
          }
        >

          <div className="read-note">
            {selected.message}
          </div>

        </Modal>

      )}


      {/* BIRTHDAY OVERLAY */}

      {celebrate && (

        <Celebration
          close={() =>
            setCelebrate(false)
          }
          count={notes.length}
        />

      )}

    </Shell>

  );
}


/*
 * BIRTHDAY CELEBRATION
 */
function Celebration({
  close,
  count
}) {

  return (

    <div className="celebrate">

      <div className="confetti">

        {Array.from(
          { length: 90 },
          (_, i) => (

            <i
              key={i}

              style={{
                left:
                  `${(i * 37) % 100}%`,

                animationDelay:
                  `${(i % 16) * .08}s`,

                fontSize:
                  `${12 + (i % 4) * 5}px`
              }}
            >

              {
                [
                  '✦',
                  '♡',
                  '✧',
                  '•'
                ][i % 4]
              }

            </i>

          )
        )}

      </div>


      <div className="celebrate-card">

        <div className="cake-big">
          🎂
        </div>

        <p>
          for the birthday girl
        </p>

        <h2>

          HAPPY
          <br />

          BIRTHDAY
          <br />

          <em>
            BABE ♡
          </em>

        </h2>

        <span>
          {count} little wishes are waiting for you
        </span>

        <button
          className="primary"
          onClick={close}
        >
          Let me read them →
        </button>

      </div>

    </div>

  );
}


/*
 * ADMIN
 */
function Admin({
  notes,
  removeNote,
  assets,
  upload,
  unlocked,
  password,
  setPassword,
  unlock,
  go
}) {

  if (!unlocked) {

    return (

      <div className="admin-login">

        <Lock size={28} />

        <p>
          Harshada's Room · Admin
        </p>

        <h2>
          Enter the secret key
        </h2>

        <input
          type="password"
          value={password}
          onChange={e =>
            setPassword(
              e.target.value
            )
          }
          placeholder="password"

          onKeyDown={e =>
            e.key === 'Enter' &&
            unlock()
          }
        />

        <button
          className="primary"
          onClick={unlock}
        >
          Unlock
        </button>

        <button
          className="plain"
          onClick={() =>
            go('home')
          }
        >
          ← back to room
        </button>

      </div>

    );
  }


  return (

    <Shell
      go={go}
      showBack={true}
    >

      <div className="admin">

        <div>

          <p className="eyebrow">
            PRIVATE CONTROL ROOM
          </p>

          <h2>
            Harshada's Room
            <br />
            <em>
              Admin
            </em>
          </h2>

        </div>


        <label className="upload">

          <Upload size={18} />

          Add room photo

          <input
            type="file"
            accept="image/*"
            onChange={upload}
          />

        </label>


        <p className="admin-tip">

          <Camera size={14} />

          Uploading here adds a photo to Harshada's room.
          The included starter photos are already pinned
          in the room.

        </p>


        <div className="admin-grid">


          <div>

            <h3>
              Wishes · {notes.length}
            </h3>


            {notes.map(
              n => (

                <div
                  className="admin-note"
                  key={n.id}
                >

                  <div>

                    <b>
                      {n.name}
                    </b>

                    <p>
                      {n.message}
                    </p>

                  </div>


                  <button
                    onClick={() =>
                      removeNote(n.id)
                    }

                    aria-label={
                      `Delete ${n.name}'s note`
                    }
                  >

                    <Trash2 size={16} />

                  </button>

                </div>

              )
            )}

          </div>


          <div>

            <h3>
              Uploaded memories · {assets.length}
            </h3>


            <div className="asset-grid">

              {assets.map(
                a => (

                  <img
                    src={a.url}
                    key={a.id}
                    alt=""
                  />

                )
              )}

            </div>

          </div>


        </div>

      </div>

    </Shell>

  );
}


/*
 * MODAL
 */
function Modal({
  title,
  close,
  children
}) {

  return (

    <div
      className="modal-back"
      onClick={close}
    >

      <div
        className="modal"

        onClick={e =>
          e.stopPropagation()
        }
      >

        <button
          className="close"
          onClick={close}
        >
          <X />
        </button>


        <p className="eyebrow">
          A LITTLE NOTE
        </p>


        <h3>
          {title}
        </h3>


        {children}

      </div>

    </div>

  );
}


createRoot(
  document.getElementById('root')
).render(
  <App />
);