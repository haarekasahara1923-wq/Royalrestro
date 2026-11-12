import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className = "", width = 50, height = 50 }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative overflow-hidden rounded-full border-2 border-primary/20 shadow-sm">
        <Image 
          src="/logo.jpg" 
          alt="The Royal Comfort Logo" 
          width={width} 
          height={height}
          className="object-cover"
        />
      </div>
    </Link>
  )
}
