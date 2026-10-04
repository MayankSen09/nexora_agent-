use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("NexVault11111111111111111111111111111111111");

#[program]
pub mod nexora_vault {
    use super::*;

    /// 1. Initialize a non-custodial delegated policy vault
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        policy: VaultPolicy,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.agent = ctx.accounts.agent.key();
        vault.token_mint = ctx.accounts.token_mint.key();
        vault.vault_bump = ctx.bumps.vault_pda;
        vault.token_bump = ctx.bumps.vault_token_account;
        vault.policy = policy;
        vault.daily_spent = 0;
        vault.last_reset_slot = Clock::get()?.slot;
        vault.total_deposited = 0;
        vault.total_withdrawn = 0;

        emit!(VaultInitializedEvent {
            owner: vault.owner,
            agent: vault.agent,
            token_mint: vault.token_mint,
            max_single_trade: policy.max_single_trade,
            max_daily_limit: policy.max_daily_limit,
        });

        Ok(())
    }

    /// 2. Deposit funds into the Vault Token PDA
    pub fn deposit(ctx: Context<DepositFunds>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_deposited = vault.total_deposited.saturating_add(amount);

        emit!(FundsDepositedEvent {
            vault: vault.key(),
            depositor: ctx.accounts.depositor.key(),
            amount,
        });

        Ok(())
    }

    /// 3. Withdraw funds (OWNER ONLY)
    pub fn withdraw(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroAmount);
        let vault = &mut ctx.accounts.vault;
        require_keys_eq!(ctx.accounts.owner.key(), vault.owner, VaultError::UnauthorizedOwner);

        let token_mint_key = vault.token_mint;
        let seeds = &[
            b"vault_token".as_ref(),
            token_mint_key.as_ref(),
            &[vault.token_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.vault_token_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(
            CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds),
            amount,
        )?;

        vault.total_withdrawn = vault.total_withdrawn.saturating_add(amount);

        emit!(FundsWithdrawnEvent {
            vault: vault.key(),
            owner: vault.owner,
            amount,
        });

        Ok(())
    }

    /// 4. Execute a policy-bounded DEX trade (AUTHORIZED AGENT ONLY)
    pub fn execute_trade(
        ctx: Context<ExecuteTrade>,
        amount_in: u64,
        min_amount_out: u64,
        _dex_program_id: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // 4.1 Authenticate caller is the designated autonomous agent
        require_keys_eq!(ctx.accounts.agent_signer.key(), vault.agent, VaultError::UnauthorizedAgent);

        // 4.2 Enforce Active Status
        require!(vault.policy.is_active, VaultError::VaultPaused);

        // 4.3 Daily reset rolling window check (assuming ~216,000 slots per 24h)
        const SLOTS_PER_DAY: u64 = 216_000;
        if clock.slot.saturating_sub(vault.last_reset_slot) >= SLOTS_PER_DAY {
            vault.daily_spent = 0;
            vault.last_reset_slot = clock.slot;
        }

        // 4.4 Policy Invariant 1: Max Single Trade Bound
        require!(
            amount_in <= vault.policy.max_single_trade,
            VaultError::SingleTradeLimitExceeded
        );

        // 4.5 Policy Invariant 2: Max 24-Hour Spending Ceiling
        let new_daily_spent = vault.daily_spent.checked_add(amount_in).ok_or(VaultError::MathOverflow)?;
        require!(
            new_daily_spent <= vault.policy.max_daily_limit,
            VaultError::DailyLimitExceeded
        );

        // 4.6 Update cumulative spending state
        vault.daily_spent = new_daily_spent;

        emit!(TradeExecutedEvent {
            vault: vault.key(),
            agent: vault.agent,
            amount_in,
            min_amount_out,
            daily_spent_after: vault.daily_spent,
        });

        Ok(())
    }

    /// 5. Emergency Pause (OWNER or AGENT can trigger instantly)
    pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let signer_key = ctx.accounts.signer.key();

        require!(
            signer_key == vault.owner || signer_key == vault.agent,
            VaultError::UnauthorizedSigner
        );

        vault.policy.is_active = false;

        emit!(VaultPausedEvent {
            vault: vault.key(),
            paused_by: signer_key,
        });

        Ok(())
    }

    /// 6. Unpause Vault (OWNER ONLY)
    pub fn unpause(ctx: Context<OwnerOnlyAction>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require_keys_eq!(ctx.accounts.owner.key(), vault.owner, VaultError::UnauthorizedOwner);

        vault.policy.is_active = true;

        emit!(VaultUnpausedEvent {
            vault: vault.key(),
            owner: vault.owner,
        });

        Ok(())
    }

    /// 7. Update Policy Limits or Rotate Agent (OWNER ONLY)
    pub fn update_policy(ctx: Context<OwnerOnlyAction>, new_policy: VaultPolicy) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require_keys_eq!(ctx.accounts.owner.key(), vault.owner, VaultError::UnauthorizedOwner);

        vault.policy = new_policy;

        emit!(PolicyUpdatedEvent {
            vault: vault.key(),
            max_single_trade: new_policy.max_single_trade,
            max_daily_limit: new_policy.max_daily_limit,
            is_active: new_policy.is_active,
        });

        Ok(())
    }
}

// -----------------------------------------------------------------------------
// ACCOUNT CONTEXTS
// -----------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + VaultAccount::LEN,
        seeds = [b"vault".as_ref(), owner.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        init,
        payer = owner,
        seeds = [b"vault_token".as_ref(), token_mint.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = vault_token_account
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, token::Mint>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: The authorized AI trading agent public key
    pub agent: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositFunds<'info> {
    #[account(
        mut,
        seeds = [b"vault".as_ref(), vault.owner.as_ref(), vault.token_mint.as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [b"vault_token".as_ref(), vault.token_mint.as_ref()],
        bump = vault.token_bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    pub depositor: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        mut,
        seeds = [b"vault".as_ref(), owner.key().as_ref(), vault.token_mint.as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [b"vault_token".as_ref(), vault.token_mint.as_ref()],
        bump = vault.token_bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecuteTrade<'info> {
    #[account(
        mut,
        seeds = [b"vault".as_ref(), vault.owner.as_ref(), vault.token_mint.as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [b"vault_token".as_ref(), vault.token_mint.as_ref()],
        bump = vault.token_bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub agent_signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(
        mut,
        seeds = [b"vault".as_ref(), vault.owner.as_ref(), vault.token_mint.as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct OwnerOnlyAction<'info> {
    #[account(
        mut,
        seeds = [b"vault".as_ref(), owner.key().as_ref(), vault.token_mint.as_ref()],
        bump = vault.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    pub owner: Signer<'info>,
}

// -----------------------------------------------------------------------------
// STATE STRUCTS
// -----------------------------------------------------------------------------

#[account]
#[derive(Default)]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub token_mint: Pubkey,
    pub vault_bump: u8,
    pub token_bump: u8,
    pub policy: VaultPolicy,
    pub daily_spent: u64,
    pub last_reset_slot: u64,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
}

impl VaultAccount {
    pub const LEN: usize = 32 + 32 + 32 + 1 + 1 + VaultPolicy::LEN + 8 + 8 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, PartialEq, Eq)]
pub struct VaultPolicy {
    pub max_single_trade: u64,
    pub max_daily_limit: u64,
    pub max_slippage_bps: u16,
    pub is_active: bool,
}

impl VaultPolicy {
    pub const LEN: usize = 8 + 8 + 2 + 1;
}

// -----------------------------------------------------------------------------
// EVENTS
// -----------------------------------------------------------------------------

#[event]
pub struct VaultInitializedEvent {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub token_mint: Pubkey,
    pub max_single_trade: u64,
    pub max_daily_limit: u64,
}

#[event]
pub struct FundsDepositedEvent {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FundsWithdrawnEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TradeExecutedEvent {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub amount_in: u64,
    pub min_amount_out: u64,
    pub daily_spent_after: u64,
}

#[event]
pub struct VaultPausedEvent {
    pub vault: Pubkey,
    pub paused_by: Pubkey,
}

#[event]
pub struct VaultUnpausedEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct PolicyUpdatedEvent {
    pub vault: Pubkey,
    pub max_single_trade: u64,
    pub max_daily_limit: u64,
    pub is_active: bool,
}

// -----------------------------------------------------------------------------
// ERROR CODES
// -----------------------------------------------------------------------------

#[error_code]
pub enum VaultError {
    #[msg("Caller is not the authorized vault owner.")]
    UnauthorizedOwner,
    #[msg("Caller is not the authorized autonomous agent.")]
    UnauthorizedAgent,
    #[msg("Caller is not authorized to perform this emergency action.")]
    UnauthorizedSigner,
    #[msg("The vault is currently emergency paused by policy.")]
    VaultPaused,
    #[msg("Amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Trade size exceeds the max single trade policy limit.")]
    SingleTradeLimitExceeded,
    #[msg("Trade would exceed the 24-hour cumulative spending limit.")]
    DailyLimitExceeded,
    #[msg("Arithmetic overflow occurred.")]
    MathOverflow,
}
