-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('water', 'gas', 'telecom', 'electricity', 'municipal')),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  officer_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors table
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) UNIQUE NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  digilocker_verified BOOLEAN DEFAULT FALSE,
  performance_score NUMERIC(4,2) DEFAULT 100.00,
  total_projects INTEGER DEFAULT 0,
  completed_on_time INTEGER DEFAULT 0,
  penalty_count INTEGER DEFAULT 0,
  penalty_amount_inr NUMERIC(12,2) DEFAULT 0,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permits table (core entity)
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_number VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  contractor_id UUID REFERENCES contractors(id),
  
  -- Location
  road_name VARCHAR(255) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Navi Mumbai',
  
  -- GIS geometry (EPSG:4326 = WGS84 lat/lng)
  trench_polygon GEOMETRY(Polygon, 4326) NOT NULL,
  center_point GEOMETRY(Point, 4326),
  
  -- Timing
  proposed_start_date DATE NOT NULL,
  proposed_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected', 'clashed')),
  
  -- Work details
  work_type VARCHAR(100) NOT NULL,
  estimated_depth_meters NUMERIC(5,2),
  estimated_area_sqm NUMERIC(10,2),
  
  -- AI flags
  clash_detected BOOLEAN DEFAULT FALSE,
  clash_permit_ids UUID[],
  ai_risk_score NUMERIC(4,2),
  
  -- Blockchain
  blockchain_tx_hash VARCHAR(100),
  blockchain_block_number BIGINT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast clash detection
CREATE INDEX permits_trench_polygon_idx ON permits USING GIST(trench_polygon);
CREATE INDEX permits_center_point_idx ON permits USING GIST(center_point);

-- Clashes table
CREATE TABLE clashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_a_id UUID REFERENCES permits(id),
  permit_b_id UUID REFERENCES permits(id),
  overlap_area_sqm NUMERIC(10,4),
  overlap_geojson TEXT,
  days_overlap INTEGER,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'negotiating', 'resolved', 'escalated')),
  resolution_type VARCHAR(50),
  mou_pdf_url TEXT,
  mou_blockchain_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Citizen complaints table
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_id UUID REFERENCES permits(id),
  
  -- Citizen info (anonymous allowed)
  citizen_phone VARCHAR(20),
  citizen_name VARCHAR(100),
  source VARCHAR(30) DEFAULT 'web' CHECK (source IN ('web', 'whatsapp', 'sms', 'app')),
  
  -- Complaint content
  raw_text TEXT NOT NULL,
  language VARCHAR(20) DEFAULT 'en',
  
  -- AI classification
  category VARCHAR(100),
  sub_category VARCHAR(100),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  department_assigned UUID REFERENCES departments(id),
  ai_summary TEXT,
  sentiment VARCHAR(20),
  
  -- Status
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
  resolution_notes TEXT,
  
  -- Crowdsource
  photo_url TEXT,
  photo_verified BOOLEAN DEFAULT FALSE,
  photo_cv_result JSONB,
  citizen_points_awarded INTEGER DEFAULT 0,
  
  -- Geo
  complaint_location GEOMETRY(Point, 4326),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Road health table (for ML model)
CREATE TABLE road_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  road_name VARCHAR(255) NOT NULL,
  ward VARCHAR(100) NOT NULL,
  road_segment GEOMETRY(LineString, 4326),
  
  -- Features for ML
  age_years NUMERIC(5,2),
  last_dig_date DATE,
  dig_count_5yr INTEGER DEFAULT 0,
  surface_condition_score NUMERIC(3,1),
  avg_rainfall_mm_annual NUMERIC(8,2),
  traffic_load_score NUMERIC(3,1),
  pipe_age_water INTEGER,
  pipe_age_gas INTEGER,
  cable_age_telecom INTEGER,
  
  -- ML output
  predicted_dig_probability_90d NUMERIC(5,4),
  prediction_updated_at TIMESTAMPTZ,
  
  -- Actuals (for retraining)
  was_dug_within_90d BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citizen points/rewards
CREATE TABLE citizen_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citizen_phone VARCHAR(20) NOT NULL,
  citizen_name VARCHAR(100),
  total_points INTEGER DEFAULT 0,
  verified_reports INTEGER DEFAULT 0,
  badge_level VARCHAR(30) DEFAULT 'newcomer' 
    CHECK (badge_level IN ('newcomer', 'contributor', 'watchdog', 'civic_champion')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity log
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(100),
  input_data JSONB,
  output_data JSONB,
  status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')),
  duration_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citizen_points_updated_at BEFORE UPDATE ON citizen_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
