export function generateWhatsAppReceipt(order: any, restaurant: any): string {
  const width = 34;
  
  const padRight = (str: string, len: number) => str.padEnd(len).substring(0, len);
  const padLeft = (str: string, len: number) => str.padStart(len).substring(0, len);
  
  const centerText = (str: string, len: number) => {
    if (str.length >= len) return str.substring(0, len);
    const left = Math.floor((len - str.length) / 2);
    const right = len - str.length - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  };

  const wrapAndCenter = (text: string, len: number): string[] => {
    if (!text) return [];
    if (text.length <= len) return [centerText(text, len)];
    const words = text.split(' ');
    const result: string[] = [];
    let current = '';
    for (const w of words) {
      if ((current ? current + ' ' + w : w).length <= len) {
        current = current ? current + ' ' + w : w;
      } else {
        if (current) result.push(centerText(current, len));
        current = w;
      }
    }
    if (current) result.push(centerText(current, len));
    return result;
  };

  const formatDishName = (name: string) => {
    if (name.length > 14) {
      return name.substring(0, 12) + '..';
    }
    return name.padEnd(14);
  };

  const lines: string[] = [];
  
  // Outer border
  lines.push('==================================');
  
  // Header: Restaurant Info
  const name = restaurant?.name || 'The Royal Comfort Hotel and Restaurant';
  const address = restaurant?.address || '';
  const phone = restaurant?.contactPhone ? `Ph: ${restaurant.contactPhone}` : '';
  
  // Wrap name into centered lines if it exceeds receipt width
  const nameLines = wrapAndCenter(name, width);
  lines.push(...nameLines);

  if (address) {
    if (address.length > width) {
      const parts = address.split(',').map((p: string) => p.trim()).filter(Boolean);
      parts.forEach((part: string) => {
        lines.push(...wrapAndCenter(part, width));
      });
    } else {
      lines.push(centerText(address, width));
    }
  }
  if (phone) {
    lines.push(centerText(phone, width));
  }
  
  lines.push('==================================');
  
  // Metadata: Date, Time, Order#, Customer
  const orderDate = new Date(order.createdAt || Date.now());
  const dateStr = orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const dateLabel = `Date: ${dateStr}`;
  const timeLabel = `Time: ${timeStr}`;
  const spaces = Math.max(1, width - dateLabel.length - timeLabel.length);
  lines.push(dateLabel + ' '.repeat(spaces) + timeLabel);
  
  lines.push(`Bill No: #${order.orderNumber || ''}`);
  if (order.customerName) {
    lines.push(`Cust: ${order.customerName}`);
  }
  if (order.tableNumber) {
    lines.push(`Table/Room: ${order.tableNumber}`);
  }
  if (order.customerPhone) {
    lines.push(`Phone: ${order.customerPhone}`);
  }
  
  lines.push('----------------------------------');
  lines.push('#  Item Name      Qty  Rate Amount');
  lines.push('----------------------------------');
  
  // Items List
  const items = order.items || [];
  items.forEach((item: any, index: number) => {
    const sn = `${index + 1}.`;
    const name = formatDishName(item.dishName || '');
    const qty = String(item.quantity || 1);
    
    // Calculate rate if unitPrice is missing
    const rawPrice = Number(item.unitPrice || 0);
    const totalPrice = Number(item.totalPrice || 0);
    const qtyNum = Number(item.quantity || 1);
    const rateVal = rawPrice > 0 ? rawPrice : (totalPrice / qtyNum);
    const rate = String(Math.round(rateVal));
    
    const amount = String(Math.round(totalPrice));
    
    const snCol = padRight(sn, 2);
    const nameCol = name;
    const qtyCol = padLeft(qty, 3);
    const rateCol = padLeft(rate, 5);
    const amountCol = padLeft(amount, 6);
    
    lines.push(`${snCol} ${nameCol} ${qtyCol} ${rateCol} ${amountCol}`);
  });
  
  lines.push('----------------------------------');
  
  // Subtotal & Taxes
  const subtotalLabel = 'Subtotal:';
  const subtotalValue = `₹${Number(order.subtotal || 0).toFixed(2)}`;
  lines.push(subtotalLabel + ' '.repeat(Math.max(1, width - subtotalLabel.length - subtotalValue.length)) + subtotalValue);
  
  const taxVal = Number(order.tax || 0);
  if (taxVal > 0) {
    const taxLabel = 'Tax:';
    const taxValue = `₹${taxVal.toFixed(2)}`;
    lines.push(taxLabel + ' '.repeat(Math.max(1, width - taxLabel.length - taxValue.length)) + taxValue);
  }
  
  const discountVal = Number(order.discount || 0);
  if (discountVal > 0) {
    const discountLabel = 'Discount:';
    const discountValue = `-₹${discountVal.toFixed(2)}`;
    lines.push(discountLabel + ' '.repeat(Math.max(1, width - discountLabel.length - discountValue.length)) + discountValue);
  }
  
  lines.push('----------------------------------');
  
  // Total
  const totalLabel = 'GRAND TOTAL:';
  const totalValue = `₹${Number(order.total || 0).toFixed(2)}`;
  lines.push(totalLabel + ' '.repeat(Math.max(1, width - totalLabel.length - totalValue.length)) + totalValue);
  
  lines.push('----------------------------------');
  if (order.paymentStatus === 'paid') {
    lines.push(centerText(`STATUS: PAID [${(order.paymentMethod || 'CASH').toUpperCase()}]`, width));
  } else {
    lines.push(centerText('STATUS: PAYMENT PENDING', width));
    lines.push(centerText('Pay via Cash, UPI or Card', width));
  }
  lines.push('==================================');
  lines.push(centerText('Thank you! Visit Again.', width));
  
  // Wrap in triple backticks for monospaced formatting in WhatsApp
  return '```\n' + lines.join('\n') + '\n```';
}
