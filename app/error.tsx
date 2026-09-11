'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="app-loading"><h1>Rencana belum dapat ditampilkan.</h1><p>Data tersimpan tidak dihapus. Coba muat ulang halaman.</p><button onClick={reset}>Coba lagi</button></main>}
