const Order = require('../models/Order');
const Product = require('../models/Product');
const Shopkeeper = require('../models/Shopkeeper');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();

    // Today range
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    // This month range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);

    const [todayOrders, monthOrders, allOrders, shopkeepers, products, recentOrders] = await Promise.all([
      Order.find({ date: { $gte: todayStart, $lte: todayEnd } }),
      Order.find({ date: { $gte: monthStart, $lte: monthEnd } }),
      Order.find({ date: { $gte: sevenDaysAgo } }).populate('shopkeeperId', 'name'),
      Shopkeeper.find({ isActive: { $ne: false } }).sort({ totalOutstanding: -1 }),
      Product.find({ isActive: { $ne: false } }),
      Order.find().sort({ date: -1 }).limit(10).populate('shopkeeperId', 'name'),
    ]);

    const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
    const monthlySales = monthOrders.reduce((s, o) => s + o.total, 0);
    const totalOutstanding = shopkeepers.reduce((s, sk) => s + sk.totalOutstanding, 0);

    // Low stock products
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);

    // Top shopkeepers by total spend
    const shopkeeperSpend = {};
    allOrders.forEach(o => {
      const id = o.shopkeeperId?._id?.toString();
      if (!id) return;
      if (!shopkeeperSpend[id]) shopkeeperSpend[id] = { name: o.shopkeeperId.name, total: 0 };
      shopkeeperSpend[id].total += o.total;
    });
    const topShopkeepers = Object.values(shopkeeperSpend)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top products by qty sold
    const productQty = {};
    allOrders.forEach(o => {
      o.items.forEach(item => {
        const pid = item.productId?.toString() || item.productName;
        if (!productQty[pid]) productQty[pid] = { name: item.productName, qty: 0 };
        productQty[pid].qty += item.quantity;
      });
    });
    const topProducts = Object.values(productQty)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Weekly sales (last 7 days grouped by day)
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0,0,0,0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23,59,59,999);
      const label = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayTotal = allOrders
        .filter(o => new Date(o.date) >= day && new Date(o.date) <= dayEnd)
        .reduce((s, o) => s + o.total, 0);
      weeklySales.push({ date: label, sales: dayTotal });
    }

    res.json({
      todaySales,
      weeklySales,
      monthlySales,
      totalOutstanding,
      topShopkeepers,
      topProducts,
      lowStockProducts,
      recentOrders,
      lowStockCount: lowStockProducts.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
