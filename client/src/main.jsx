import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

async function api(url, { token, ...options } = {}) {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Impossible de contacter le serveur.');
  return data;
}

const date = value => new Date(value).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function Avatar({ name }) { return <span className="avatar">{name.slice(0, 2).toUpperCase()}</span>; }

function Auth({ onConnect }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      onConnect(await api(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST', body: JSON.stringify(Object.fromEntries(form)),
      }));
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <section className="card auth">
    <span className="eyebrow">BIENVENUE CHEZ VOUS</span>
    <h2>{register ? 'On fait connaissance ?' : 'Heureux de vous revoir.'}</h2>
    <p className="muted">Connectez-vous pour prendre part à la conversation.</p>
    <form onSubmit={submit}>
      <label>Pseudo<input name="username" autoComplete="username" required minLength={2} maxLength={30} /></label>
      <label>Mot de passe<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 6 : 1} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>{busy ? 'Un instant…' : register ? 'Créer mon compte' : 'Se connecter'} <span>→</span></button>
    </form>
    <button className="text-button" onClick={() => { setRegister(!register); setError(''); }}>
      {register ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S’inscrire'}
    </button>
  </section>;
}

function Post({ post, session, onComment }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const comment = await api(`/posts/${post.id}/comments`, { token: session.token, method: 'POST', body: JSON.stringify({ content }) });
      onComment(post.id, comment);
      setContent('');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <article className="card post">
    <div className="author"><Avatar name={post.author.username} /><div><strong>{post.author.username}</strong><time dateTime={post.createdAt}>{date(post.createdAt)}</time></div></div>
    <p className="post-content">{post.content}</p>
    <div className="comment-count">{post.comments.length} commentaire{post.comments.length !== 1 ? 's' : ''}</div>
    {post.comments.map(comment => <div className="comment" key={comment.id}>
      <Avatar name={comment.author.username} /><div className="comment-body"><strong>{comment.author.username}</strong><p>{comment.content}</p><time dateTime={comment.createdAt}>{date(comment.createdAt)}</time></div>
    </div>)}
    {session && <form className="comment-form" onSubmit={submit}>
      <input aria-label="Votre commentaire" placeholder="Ajouter un commentaire…" value={content} onChange={event => setContent(event.target.value)} maxLength={500} required />
      <button disabled={busy || !content.trim()} aria-label="Envoyer le commentaire">→</button>
    </form>}
    {error && <p className="error" role="alert">{error}</p>}
  </article>;
}

function App() {
  const [session, setSession] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api('/posts').then(setPosts).catch(error => setError(error.message)).finally(() => setLoading(false));
    const token = localStorage.getItem('token');
    if (token) api('/auth/me', { token }).then(user => setSession({ token, user })).catch(() => localStorage.removeItem('token'));
  }, []);
  function connect(value) {
    localStorage.setItem('token', value.token);
    setSession(value);
  }
  async function logout() {
    try { await api('/auth/logout', { token: session.token, method: 'POST' }); }
    catch { /* La déconnexion locale reste disponible si le serveur a redémarré. */ }
    localStorage.removeItem('token');
    setSession(null);
  }
  async function publish(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const post = await api('/posts', { token: session.token, method: 'POST', body: JSON.stringify({ content }) });
      setPosts(previous => [post, ...previous]);
      setContent('');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  function onComment(postId, comment) {
    setPosts(previous => previous.map(post => post.id === postId ? { ...post, comments: [...post.comments, comment] } : post));
  }
  return <>
    <header><a className="brand" href="/">entre nous<span>✳</span></a><div className="account">{session ? <><span>{session.user.username}</span><button className="text-button" onClick={logout}>Se déconnecter</button></> : <span>Un petit coin pour échanger.</span>}</div></header>
    <main>
      <section className="intro"><span className="eyebrow">LES PETITES CONVERSATIONS FONT LES GRANDS LIENS</span><h1>Une idée, une nouvelle,<br />un petit mot<span>.</span></h1><p>Partagez ce qui vous passe par la tête.<br />La conversation commence ici.</p></section>
      <div className="layout"><section className="feed">
        <div className="feed-heading"><h2>Le fil de discussion</h2><span>{posts.length} publication{posts.length !== 1 ? 's' : ''}</span></div>
        {session && <form className="card composer" onSubmit={publish}><div className="author"><Avatar name={session.user.username} /><strong>À vous la parole, {session.user.username}.</strong></div><textarea aria-label="Votre publication" placeholder="Quoi de neuf aujourd’hui ?" value={content} onChange={event => setContent(event.target.value)} maxLength={2000} required /><div className="composer-footer"><small>{content.length} / 2 000</small><button disabled={busy || !content.trim()}>{busy ? 'Publication…' : 'Publier'} <span>↗</span></button></div></form>}
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <div className="card empty">Chargement des conversations…</div> : posts.length === 0 ? <div className="card empty"><span>✳</span><h3>Tout commence par un mot.</h3><p>Soyez la première personne à lancer la conversation.</p></div> : posts.map(post => <Post key={post.id} post={post} session={session} onComment={onComment} />)}
      </section><aside>{!session ? <Auth onConnect={connect} /> : <section className="card welcome"><span className="eyebrow">VOTRE PETIT COIN</span><h2>Bienvenue, {session.user.username}.</h2><p>Une pensée à partager ? Une discussion à poursuivre ? Vous êtes au bon endroit.</p></section>}<p className="aside-note">Des idées, du partage et un peu de vous.<br />C’est tout ce qu’il faut.</p></aside></div>
    </main><footer>entre nous <span>Un espace simple. Des conversations qui comptent.</span></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
