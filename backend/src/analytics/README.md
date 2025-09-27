# Health Dashboard Service

The Health Dashboard Service provides a comprehensive analytics and visualization platform for the MediMind application. It enables real-time monitoring of health metrics, patient data visualization, and interactive dashboards for healthcare providers and researchers.

## Features

- **Real-time Data Visualization**: Interactive charts and graphs powered by D3.js and Chart.js
- **Customizable Dashboards**: Create, modify, and share dashboards with drag-and-drop widgets
- **Multiple Data Sources**: Integrates with InfluxDB for time-series data and Redis for caching
- **Export Capabilities**: Export dashboards as PDF, PNG, or JSON
- **Role-based Access Control**: Secure access to dashboards based on user roles
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 16+
- Redis 6+
- InfluxDB 2.0+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Set up environment variables in `.env`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# InfluxDB Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=medimind
INFLUXDB_BUCKET=health_metrics

# JWT Configuration
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

## Usage

### Creating a Dashboard

```javascript
const dashboardService = new HealthDashboardService(config);
await dashboardService.initialize();

const dashboard = await dashboardService.createDashboard(
  'user123',
  'patient_overview',
  {
    name: 'My Patient Dashboard',
    refreshInterval: 30000,
    theme: 'dark',
    isPublic: false
  }
);
```

### Adding Widgets

```javascript
const widget = await dashboardService.addWidget(
  dashboard.id,
  {
    type: 'vital_signs_chart',
    position: { x: 0, y: 0, w: 6, h: 4 },
    config: {
      patientId: 'patient123',
      metrics: ['heart_rate', 'blood_pressure']
    }
  }
);
```

### API Endpoints

- `GET /api/dashboards` - List all dashboards
- `POST /api/dashboards` - Create a new dashboard
- `GET /api/dashboards/:id` - Get dashboard by ID
- `PUT /api/dashboards/:id` - Update dashboard
- `DELETE /api/dashboards/:id` - Delete dashboard
- `GET /api/dashboards/:id/export?format=pdf|png|json` - Export dashboard

## Widget Types

1. **Vital Signs Chart**: Displays patient vital signs over time
2. **Risk Assessment**: Shows risk scores and predictions
3. **Activity Heatmap**: Visualizes patient activity patterns
4. **Patient List**: Displays a list of patients with key metrics
5. **Alert Center**: Shows active alerts and notifications
6. **Population Health**: Aggregated health metrics for patient populations
7. **Clinical Metrics**: Key performance indicators for healthcare providers

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Deployment

The service can be deployed using Docker:

```bash
docker build -t medimind-dashboard-service .
docker run -p 3000:3000 --env-file .env medimind-dashboard-service
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
