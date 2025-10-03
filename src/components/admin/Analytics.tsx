import React from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Analytics: React.FC = () => {
  // Mock data for demonstration
  const salesData = [
    { name: 'Mon', sales: 1200 },
    { name: 'Tue', sales: 1900 },
    { name: 'Wed', sales: 800 },
    { name: 'Thu', sales: 1600 },
    { name: 'Fri', sales: 2400 },
    { name: 'Sat', sales: 2800 },
    { name: 'Sun', sales: 2200 }
  ];

  const topItems = [
    { name: 'Margherita Pizza', sales: 89, revenue: 1689.11, change: '+12%' },
    { name: 'Classic Cheeseburger', sales: 67, revenue: 1004.33, change: '+8%' },
    { name: 'Salmon Avocado Roll', sales: 45, revenue: 584.55, change: '+15%' },
    { name: 'Pasta Carbonara', sales: 34, revenue: 577.66, change: '-2%' },
    { name: 'Caesar Salad', sales: 28, revenue: 335.72, change: '+5%' }
  ];

  const categoryData = [
    { name: 'Pizza', value: 35, color: '#8884d8' },
    { name: 'Burgers', value: 25, color: '#82ca9d' },
    { name: 'Sushi', value: 20, color: '#ffc658' },
    { name: 'Pasta', value: 12, color: '#ff7c7c' },
    { name: 'Salads', value: 8, color: '#8dd1e1' }
  ];

  const stats = [
    {
      title: 'Total Revenue',
      value: '$12,458',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Total Orders',
      value: '346',
      change: '+8.2%',
      icon: ShoppingBag,
      color: 'text-blue-600'
    },
    {
      title: 'Active Customers',
      value: '1,234',
      change: '+15.3%',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Average Rating',
      value: '4.8',
      change: '+0.2',
      icon: Star,
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
        <p className="text-muted-foreground">
          Track your restaurant's performance and identify trends
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">{stat.change}</span>
                  <span className="text-muted-foreground ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.sales} orders • ${item.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={item.change.startsWith('+') ? 'default' : 'destructive'}
                    className="mb-2"
                  >
                    {item.change}
                  </Badge>
                  <div className="w-24">
                    <Progress value={(item.sales / 100) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">New order #347 received - $24.99</span>
              <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Menu item "Margherita Pizza" updated</span>
              <span className="text-xs text-muted-foreground ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Order #345 marked as delivered</span>
              <span className="text-xs text-muted-foreground ml-auto">8 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">New customer review - 5 stars</span>
              <span className="text-xs text-muted-foreground ml-auto">12 min ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};