-- NEXORA Initial PostgreSQL Migration
-- Version: 001_init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Wallets (Public Keys Only - Never private keys)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key VARCHAR(64) UNIQUE NOT NULL,
    label VARCHAR(100),
    network VARCHAR(20) DEFAULT 'DEVNET' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wallets_pubkey ON wallets(public_key);

-- 3. Agents
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'Nexora Alpha' NOT NULL,
    state VARCHAR(30) DEFAULT 'IDLE' NOT NULL,
    environment VARCHAR(20) DEFAULT 'DEVNET' NOT NULL,
    policy_config JSONB NOT NULL,
    is_paused BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_state ON agents(state);

-- 4. Markets
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(64) UNIQUE NOT NULL,
    venue VARCHAR(30) NOT NULL,
    base_mint VARCHAR(64) NOT NULL,
    base_symbol VARCHAR(30) NOT NULL,
    base_decimals INT NOT NULL,
    quote_mint VARCHAR(64) NOT NULL,
    quote_symbol VARCHAR(30) NOT NULL,
    quote_decimals INT NOT NULL,
    is_mint_renounced BOOLEAN DEFAULT TRUE NOT NULL,
    is_freeze_disabled BOOLEAN DEFAULT TRUE NOT NULL,
    is_lp_locked BOOLEAN DEFAULT TRUE NOT NULL,
    lp_locked_percent DOUBLE PRECISION DEFAULT 100.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_markets_address ON markets(address);
CREATE INDEX IF NOT EXISTS idx_markets_pair ON markets(base_mint, quote_mint);
CREATE INDEX IF NOT EXISTS idx_markets_venue ON markets(venue);

-- 5. Market Snapshots
CREATE TABLE IF NOT EXISTS market_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    price_usdc DOUBLE PRECISION NOT NULL,
    volume_24h_usdc DOUBLE PRECISION NOT NULL,
    volume_15m_usdc DOUBLE PRECISION NOT NULL,
    liquidity_depth_usdc DOUBLE PRECISION NOT NULL,
    fee_apr_pct DOUBLE PRECISION NOT NULL,
    realized_volatility_1h_pct DOUBLE PRECISION NOT NULL,
    order_flow_imbalance DOUBLE PRECISION NOT NULL,
    active_bin_id INT,
    opportunity_score DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_ts ON market_snapshots(market_id, timestamp DESC);

-- 6. Signals
CREATE TABLE IF NOT EXISTS signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    weight DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Decisions
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    position_size_percent DOUBLE PRECISION NOT NULL,
    entry_reason TEXT NOT NULL,
    invalidation_reason TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    time_horizon VARCHAR(30) NOT NULL,
    composite_score DOUBLE PRECISION NOT NULL,
    risk_verdict VARCHAR(20) NOT NULL,
    rejection_reason VARCHAR(100),
    clamped_size_usdc DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions_agent_ts ON decisions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_verdict ON decisions(risk_verdict);

ALTER TABLE signals ADD CONSTRAINT fk_signals_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_signals_decision_id ON signals(decision_id);

-- 8. Risk Events
CREATE TABLE IF NOT EXISTS risk_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    reason_code VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    action_taken VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_risk_events_agent_ts ON risk_events(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_code ON risk_events(reason_code);

-- 9. Positions
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    direction VARCHAR(10) DEFAULT 'LONG' NOT NULL,
    entry_price_usdc DOUBLE PRECISION NOT NULL,
    current_price_usdc DOUBLE PRECISION NOT NULL,
    size_units DOUBLE PRECISION NOT NULL,
    size_usdc DOUBLE PRECISION NOT NULL,
    unrealized_pnl_usdc DOUBLE PRECISION DEFAULT 0 NOT NULL,
    unrealized_pnl_pct DOUBLE PRECISION DEFAULT 0 NOT NULL,
    take_profit_price_usdc DOUBLE PRECISION NOT NULL,
    stop_loss_price_usdc DOUBLE PRECISION NOT NULL,
    trailing_stop_price_usdc DOUBLE PRECISION,
    peak_price_usdc DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_positions_wallet_status ON positions(wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_positions_agent_status ON positions(agent_id, status);

-- 10. Trades
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
    side VARCHAR(10) NOT NULL,
    price_usdc DOUBLE PRECISION NOT NULL,
    size_units DOUBLE PRECISION NOT NULL,
    size_usdc DOUBLE PRECISION NOT NULL,
    realized_pnl_usdc DOUBLE PRECISION,
    realized_pnl_pct DOUBLE PRECISION,
    fee_usdc DOUBLE PRECISION DEFAULT 0 NOT NULL,
    exit_reason VARCHAR(50),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trades_wallet_ts ON trades(wallet_id, executed_at DESC);

-- 11. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    signature VARCHAR(128) UNIQUE NOT NULL,
    slot BIGINT,
    environment VARCHAR(20) DEFAULT 'DEVNET' NOT NULL,
    compute_units_consumed INT,
    fee_lamports BIGINT,
    status VARCHAR(20) DEFAULT 'CONFIRMED' NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_sig ON transactions(signature);

-- 12. Portfolio Snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_equity_usdc DOUBLE PRECISION NOT NULL,
    free_cash_usdc DOUBLE PRECISION NOT NULL,
    allocated_capital_usdc DOUBLE PRECISION NOT NULL,
    unrealized_pnl_usdc DOUBLE PRECISION NOT NULL,
    realized_pnl_24h_usdc DOUBLE PRECISION NOT NULL,
    win_rate_pct DOUBLE PRECISION NOT NULL,
    profit_factor DOUBLE PRECISION NOT NULL,
    open_positions_count INT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_portfolio_snaps_ts ON portfolio_snapshots(user_id, timestamp DESC);

-- 13. Agent Events
CREATE TABLE IF NOT EXISTS agent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    from_state VARCHAR(30) NOT NULL,
    to_state VARCHAR(30) NOT NULL,
    trigger VARCHAR(100) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_events_ts ON agent_events(agent_id, timestamp DESC);

-- 14. System Events
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) DEFAULT 'INFO' NOT NULL,
    source VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_system_events_ts ON system_events(level, timestamp DESC);
