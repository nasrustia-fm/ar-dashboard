# AR Dashboard - Accounts Receivable Analytics

Interactive Accounts Receivable (AR) metrics dashboard with CSV upload, automated calculations, and Docker deployment. Features real-time AR analytics, week-over-week comparisons, and API integration for automation tools like n8n.

## 🚀 Features

- **CSV Data Upload**: Easy drag-and-drop CSV file upload for AR data
- **Real-time Analytics**: Interactive dashboard with key AR metrics
- **Week-over-Week Comparisons**: Track performance trends over time
- **Automated Calculations**: Built-in AR aging, DSO, and collection metrics
- **API Integration**: RESTful endpoints for automation tools (n8n, Zapier, etc.)
- **Docker Deployment**: Containerized setup for easy deployment
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 📊 Key Metrics Tracked

- **Days Sales Outstanding (DSO)**
- **AR Aging Analysis** (0-30, 31-60, 61-90, 90+ days)
- **Collection Efficiency Ratio**
- **Bad Debt Percentage**
- **Average Collection Period**
- **AR Turnover Ratio**
- **Weekly/Monthly Trends**

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Deployment**: Docker, Docker Compose
- **Charts**: Recharts for data visualization
- **File Processing**: CSV parsing and validation

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (for containerized deployment)
- Git

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ar-dashboard.git
   cd ar-dashboard
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the dashboard**
   - Open http://localhost:3000 in your browser
   - The database will be automatically initialized

### Option 2: Local Development

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/ar-dashboard.git
   cd ar-dashboard
   npm install
   ```

2. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the dashboard**
   - Open http://localhost:3000 in your browser

## 📁 Project Structure

```
ar-dashboard/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility functions
│   │   └── types/         # TypeScript definitions
│   └── styles/            # Global styles
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── public/                # Static assets
├── docker-compose.yml     # Docker services configuration
├── Dockerfile            # Container configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 📤 CSV Upload Format

The dashboard expects CSV files with the following columns:

```csv
invoice_id,customer_name,invoice_date,due_date,amount,status
INV-001,Acme Corp,2024-01-15,2024-02-14,5000.00,outstanding
INV-002,Tech Solutions,2024-01-20,2024-02-19,3500.00,paid
INV-003,Global Industries,2024-01-25,2024-02-24,7500.00,overdue
```

### Required Columns:
- `invoice_id`: Unique identifier for the invoice
- `customer_name`: Name of the customer
- `invoice_date`: Date when invoice was issued (YYYY-MM-DD)
- `due_date`: Payment due date (YYYY-MM-DD)
- `amount`: Invoice amount (numeric)
- `status`: Payment status (outstanding, paid, overdue, partial)

## 🔌 API Endpoints

### Upload Data
```http
POST /api/upload
Content-Type: multipart/form-data

# Upload CSV file
```

### Get AR Metrics
```http
GET /api/metrics
```

Response:
```json
{
  "dso": 45.2,
  "totalOutstanding": 125000.00,
  "overdueAmount": 35000.00,
  "collectionEfficiency": 0.85,
  "agingBuckets": {
    "0-30": 60000.00,
    "31-60": 30000.00,
    "61-90": 20000.00,
    "90+": 15000.00
  }
}
```

### Get Historical Data
```http
GET /api/historical?period=weekly
```

## 🐳 Docker Configuration

The project includes Docker configuration for easy deployment:

- **Dockerfile**: Multi-stage build for optimized production image
- **docker-compose.yml**: Complete stack with database and application
- **Environment Variables**: Configurable through `.env` file

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@db:5432/ar_dashboard"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma` and run migrations
2. **API Endpoints**: Add new routes in `src/app/api/`
3. **Components**: Create reusable components in `src/app/components/`
4. **Types**: Define TypeScript types in `src/app/types/`

## 🔗 Integration with Automation Tools

### n8n Integration

The dashboard provides API endpoints that can be easily integrated with n8n workflows:

1. **Data Upload Automation**: Use HTTP Request node to upload CSV files
2. **Metrics Monitoring**: Set up scheduled workflows to fetch AR metrics
3. **Alert System**: Create notifications based on AR thresholds

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "hour": 9,
          "minute": 0
        }
      }
    },
    {
      "name": "Get AR Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3000/api/metrics",
        "method": "GET"
      }
    }
  ]
}
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries for large datasets
- **Caching**: Redis integration for frequently accessed data
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Splitting**: Automatic code splitting for faster loads

## 🔒 Security Features

- **Input Validation**: CSV data validation and sanitization
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Environment Variables**: Sensitive data stored securely

## 🚀 Deployment Options

### Production Deployment

1. **Docker Swarm**
2. **Kubernetes**
3. **AWS ECS/Fargate**
4. **Google Cloud Run**
5. **Azure Container Instances**

### Scaling Considerations

- **Database**: Consider PostgreSQL for production workloads
- **File Storage**: Use cloud storage for large CSV files
- **Caching**: Implement Redis for better performance
- **Load Balancing**: Use reverse proxy for multiple instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the wiki for detailed documentation
- **Community**: Join our discussions for help and tips

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core AR dashboard functionality
- CSV upload and processing
- Real-time metrics calculation
- Docker deployment support
- API endpoints for automation

---

**Built with ❤️ for better AR management**
