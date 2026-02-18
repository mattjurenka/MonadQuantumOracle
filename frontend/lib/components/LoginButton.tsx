import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';

export default function LoginButton() {
    const { ready, authenticated, exportWallet } = usePrivy();
    const { login } = useLogin();
    const { wallets } = useWallets()
    // Disable login when Privy is not ready or the user is already authenticated
    return (
        <button
            className="bg-white text-black px-4 py-2 rounded-md cursor-pointer"
            onClick={() => {
                if (wallets.length > 0) {
                    exportWallet({ address: wallets[0].address})
                } else {
                    login()
                }
            }}
        >
            {authenticated ? `Logged in as ${wallets[0]?.address}` : "Log in"}
        </button>
    );
}