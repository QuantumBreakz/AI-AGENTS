export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', padding: 16 }}>
        {children}
      </body>
    </html>
  )
}
