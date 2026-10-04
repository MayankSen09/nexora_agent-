use anchor_lang::prelude::*;

declare_id!("NexoraVault11111111111111111111111111111111");

#[program]
pub mod nexora_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, max_single_trade_usdc: u64, max_daily_limit_usdc: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.agent = ctx.accounts.agent.key();
        vault.max_single_trade_usdc = max_single_trade_usdc;
        vault.max_daily_limit_usdc = max_daily_limit_usdc;
        vault.daily_spent_usdc = 0;
        vault.is_active = true;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 32 + 8 + 8 + 8 + 1)]
    pub vault: Account<'info, VaultAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: The authorized agent public key
    pub agent: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub max_single_trade_usdc: u64,
    pub max_daily_limit_usdc: u64,
    pub daily_spent_usdc: u64,
    pub is_active: bool,
}
