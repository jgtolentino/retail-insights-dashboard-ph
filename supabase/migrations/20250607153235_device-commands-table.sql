-- Device Commands Table
-- For sending commands to IoT devices via database

CREATE TABLE IF NOT EXISTS device_commands (
    command_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    command_type VARCHAR(50) NOT NULL CHECK (command_type IN ('restart', 'update_firmware', 'adjust_settings', 'run_diagnostics', 'clear_cache', 'sync_time')),
    parameters JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'executed', 'failed', 'timeout')),
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    executed_at TIMESTAMP,
    result JSONB,
    error_message TEXT,
    timeout_seconds INT DEFAULT 300,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3
);

-- Index for device commands
CREATE INDEX IF NOT EXISTS idx_device_commands_device_id ON device_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_device_commands_status ON device_commands(status);
CREATE INDEX IF NOT EXISTS idx_device_commands_created_at ON device_commands(created_at);

-- Function to automatically timeout old commands
CREATE OR REPLACE FUNCTION timeout_old_commands()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE device_commands 
    SET status = 'timeout'
    WHERE status IN ('pending', 'sent') 
      AND created_at < NOW() - INTERVAL '1 second' * timeout_seconds;
END;
$$;