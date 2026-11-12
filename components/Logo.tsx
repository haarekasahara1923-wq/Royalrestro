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
      <div className="relative overflow-hidden rounded-full border-2 border-[#D4AF37]/40 shadow-sm bg-black flex-shrink-0">
        <Image 
          src="/logo.png" 
          alt="The Royal Comfort Logo" 
          width={width} 
          height={height}
          className="object-cover"
          priority
        />
      </div>
    </Link>
  )
}
