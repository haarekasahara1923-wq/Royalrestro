import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId, total } = await req.json()
    const options = {
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${orderId}`,
      notes: { orderId, restaurant: 'The Royal Comfort Hotel and Restaurant' },
    }
    const rzpOrder = await razorpay.orders.create(options)
    return NextResponse.json({ razorpayOrderId: rzpOrder.id })
  } catch (error) {
    console.error('Razorpay Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
