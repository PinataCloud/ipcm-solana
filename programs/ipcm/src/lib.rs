use anchor_lang::prelude::*;

declare_id!("8qahaLELWEWf887XVZusJgEe6PDk2GmQ1fisnBj7MKtj"); // Replace with your program ID

#[program]
pub mod ipcm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let ipcm_account = &mut ctx.accounts.ipcm_account;
        ipcm_account.owner = ctx.accounts.owner.key();
        ipcm_account.cid_mapping = String::new();
        Ok(())
    }

    pub fn update_mapping(ctx: Context<UpdateMapping>, new_value: String) -> Result<()> {
        let ipcm_account = &mut ctx.accounts.ipcm_account;

        // Check if the signer is the owner
        require!(
            ctx.accounts.owner.key() == ipcm_account.owner,
            IPCMError::UnauthorizedAccess
        );

        // Update the mapping
        ipcm_account.cid_mapping = new_value;

        // Emit an event
        emit!(MappingUpdatedEvent {
            value: ipcm_account.cid_mapping.clone()
        });

        Ok(())
    }

    pub fn get_mapping(ctx: Context<GetMapping>) -> Result<String> {
        let ipcm_account = &ctx.accounts.ipcm_account;
        Ok(ipcm_account.cid_mapping.clone())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 200, // discriminator + pubkey + max string length
    )]
    pub ipcm_account: Account<'info, IPCMAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMapping<'info> {
    #[account(mut)]
    pub ipcm_account: Account<'info, IPCMAccount>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetMapping<'info> {
    pub ipcm_account: Account<'info, IPCMAccount>,
}

#[account]
pub struct IPCMAccount {
    pub owner: Pubkey,
    pub cid_mapping: String,
}

#[event]
pub struct MappingUpdatedEvent {
    pub value: String,
}

#[error_code]
pub enum IPCMError {
    #[msg("Only the owner can perform this action")]
    UnauthorizedAccess,
}
