import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'NusaTrip — Rencanakan perjalananmu',description:'Jelajahi Indonesia, susun itinerary yang realistis, dan kelola budget perjalanan dalam satu workspace.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
