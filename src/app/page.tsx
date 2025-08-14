"use client";

import { useEffect, useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "./client";
import { NNS } from "@nadnameservice/nns-ethers-sdk";
import { ethers } from "ethers";
import Image from "next/image";

export default function Home() {
  const account = useActiveAccount();

  const [primaryName, setPrimaryName] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ownsNFT, setOwnsNFT] = useState<boolean | null>(null);
  const [nftCount, setNftCount] = useState(0);
  const [contractName, setContractName] = useState("");

  // ERC20 state
  const [erc20Name, setErc20Name] = useState("");
  const [erc20Balance, setErc20Balance] = useState("0");
  const [monadBalance, setMonadBalance] = useState("0");

  // Replace with your ERC721 contract address
  const erc721Address = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string;
  const erc721Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function name() view returns (string)",
  ];

  // Replace with your ERC20 contract address
  const erc20Address = process.env.NEXT_PUBLIC_ERC20_CONTRACT_ADDRESS as string;
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  useEffect(() => {
    if (!account) return;

    const provider = new ethers.providers.JsonRpcProvider(
      "https://testnet-rpc.monad.xyz"
    );
    const nns = new NNS(provider);
    const erc721 = new ethers.Contract(erc721Address, erc721Abi, provider);
    const erc20 = new ethers.Contract(erc20Address, erc20Abi, provider);

    (async () => {
      try {
        // --- NNS lookup ---
        const name = await nns.getPrimaryNameForAddress(account.address);
        setPrimaryName(name);

        if (name) {
          const resolved = await nns.getResolvedAddress(name);
          setResolvedAddress(resolved);

          const avatar = await nns.getAvatarUrl(name);
          console.log("Resolved Avatar URL:", avatar);
          setAvatarUrl(avatar);
        }

        // --- ERC721 ---
        const nftBal = await erc721.balanceOf(account.address);
        setOwnsNFT(nftBal.gt(0));
        setNftCount(nftBal.toNumber());
        const cName = await erc721.name();
        setContractName(cName);

        // --- ERC20 ---
        const tokenBalanceRaw = await erc20.balanceOf(account.address);
        const decimals = await erc20.decimals();
        const tokenBalanceFormatted = Number(tokenBalanceRaw.toString()) / Math.pow(10, decimals);
        setErc20Balance(tokenBalanceFormatted.toFixed(3));
        const tokenName = await erc20.name();
        setErc20Name(tokenName);

        // --- Native Monad balance ---
        const nativeBalanceRaw = await provider.getBalance(account.address);
        const nativeBalanceFormatted = Number(nativeBalanceRaw.toString()) / 1e18;
        setMonadBalance(nativeBalanceFormatted.toFixed(3));

      } catch (err) {
        console.error("Error fetching data:", err);
        setOwnsNFT(false);
      }
    })();
  }, [account]);

  const shortenAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Navbar */}
      <nav className="sticky top-0 w-full bg-gray-900/70 backdrop-blur-md z-50 shadow-lg flex items-center justify-between px-6 py-4">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-blue-400 drop-shadow-md">
          Thirdweb SDK + NNS + Next.js
        </h1>
        <div className="text-white px-4 py-2 rounded-lg shadow-md transition">
          <ConnectButton
            client={client}
            appMetadata={{
              name: "Example App",
              url: "https://example.com",
            }}
          />
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex flex-col items-center justify-center h-[calc(100vh-72px)] px-4">
        {!account ? (
          <p className="text-zinc-400 text-lg md:text-2xl text-center animate-pulse">
            Please connect your wallet to continue.
          </p>
        ) : ownsNFT === null ? (
          <p className="text-zinc-400 text-lg animate-pulse">Checking NFT ownership...</p>
        ) : !ownsNFT ? (
          <p className="text-red-400 text-lg md:text-2xl text-center font-semibold">
            🚫 Access Denied — You don’t own the required NFT.
          </p>
        ) : (
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/70 p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center space-y-6 border border-gray-700">
            {/* Avatar */}
            {avatarUrl ? (
              <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-blue-500 shadow-lg">
                <Image
                  src={`/api/avatar-proxy?url=${encodeURIComponent(
                    avatarUrl.startsWith("ipfs://")
                      ? `https://ipfs.io/ipfs/${avatarUrl.split("ipfs://")[1]}`
                      : avatarUrl
                  )}`}
                  alt="Avatar"
                  width={112}
                  height={112}
                  className="rounded-full object-cover"
                />

              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 border border-gray-600">
                No Avatar
              </div>
            )}

            {/* Primary Name */}
            {primaryName && (
              <p className="text-2xl font-bold text-blue-400 tracking-wide drop-shadow-md">
                {primaryName}
              </p>
            )}

            {/* Connected Info */}
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-400">
                Connected:{" "}
                <span className="text-green-400 font-mono">{shortenAddress(account.address)}</span>
              </p>
              {resolvedAddress && (
                <p className="text-sm text-gray-400">
                  Resolved Address:{" "}
                  <span className="text-yellow-400 font-mono">{shortenAddress(resolvedAddress)}</span>
                </p>
              )}
            </div>

            <hr className="w-full border-gray-700 my-4" />

            {/* NFT Info */}
            <div className="text-center space-y-1">
              <p className="text-lg text-blue-400 font-semibold drop-shadow-md">{contractName}</p>
              <p className="text-sm text-green-400 font-medium">
                You own {nftCount} NFT{nftCount > 1 ? "s" : ""}
              </p>
            </div>

            <hr className="w-full border-gray-700 my-4" />

            {/* ERC20 Info */}
            <div className="text-center space-y-1">
              <p className="text-lg text-blue-400 font-semibold drop-shadow-md">{erc20Name}</p>
              <p className="text-sm text-green-400 font-medium">
                Balance: {Number(erc20Balance).toFixed(3)}
              </p>
            </div>

            <hr className="w-full border-gray-700 my-4" />

            {/* Native Monad Balance */}
            <div className="text-center space-y-1">
              <p className="text-lg text-blue-400 font-semibold drop-shadow-md">MONAD</p>
              <p className="text-sm text-green-400 font-medium">
                Balance: {Number(monadBalance).toFixed(3)}
              </p>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
