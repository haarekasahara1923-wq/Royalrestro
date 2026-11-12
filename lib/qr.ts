import QRCode from 'qrcode'

export async function generateMenuQR(targetUrl: string): Promise<string> {
  return QRCode.toDataURL(targetUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#B5451B', light: '#FFF8F0' },
    errorCorrectionLevel: 'H',
  })
}
