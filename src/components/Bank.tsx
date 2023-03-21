// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import { Program, AnchorProvider, web3, utils, BN } from "@project-serum/anchor";
import idl from "./solanapdas.json";
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react'
import { each } from 'immer/dist/internal';

const idl_str = JSON.stringify(idl);
const idl_obj = JSON.parse(idl_str);
const programId = new PublicKey(idl.metadata.address);

export const Bank: FC = () => {
    const ourWallet = useWallet();
    const { connection } = useConnection();

    const [banks, setBanks] = useState([]);

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions());
        return provider;
    }

    const createBank = async () => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_obj, programId, anchProvider);

            // find program id of bank
            const [bank] = await PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode('bankaccount'),
                anchProvider.wallet.publicKey.toBuffer()
            ], program.programId);

            await program.rpc.create("Wsos Bank2", {
                accounts: {
                    bank,
                    user: anchProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });

            console.log("New bank added: " + bank.toString());
        } catch (error) {
            console.log('Error:' + error);
        }
    }

    const getBanks = async () => {
        const anchProvider = getProvider();
        const program = new Program(idl_obj, programId, anchProvider);
        try {
            Promise.all(((await connection.getProgramAccounts(programId))).map(async bank => ({
                ...(await program.account.bank.fetch(bank.pubkey)),
                pubkey: bank.pubkey
            }))).then(banks => {
                
                setBanks(banks)
            })
        } catch (error) {
            console.log("error: " + error);
        }
    }

    const depositBank = async (publicKey) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_obj, programId, anchProvider);

            await program.rpc.deposit(new BN(0.1 * LAMPORTS_PER_SOL), {
                accounts: {
                    bank: publicKey,
                    user: anchProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });

            console.log("Deposit done " + publicKey);
        } catch (error) {
            console.log('Error:' + error);
        }
    }

    const withdrawBank = async (publicKey, amount) => {
        try {
            const anchProvider = getProvider();
            const program = new Program(idl_obj, programId, anchProvider);
            await program.rpc.withdraw(new BN(amount), {
                accounts: {
                    bank: publicKey,
                    user: anchProvider.wallet.publicKey
                }
            });

            console.log("withdraw done " + publicKey);
        } catch (error) {
            console.log('Error:' + error);
        }
    }
    return (
        <>
            {banks.map((bank) => {
                return (
                    <div key={bank.pubkey.toString()} className='md:hero-content flex flex-col'>
                        <h1>{bank.name.toString()}</h1>
                        <span>{bank.balance.toString()}</span>
                        <button
                            className='group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500'
                            onClick={() => depositBank(bank.pubkey)}
                        >
                            <span>
                                Deposit 0.1
                            </span>
                        </button>

                        <button
                            className='group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500'
                            onClick={() => withdrawBank(bank.pubkey, bank.balance.toString())}
                        >
                            <span>
                                Withdraw all funds
                            </span>
                        </button>
                    </div>
                )
            })}
            <div className="flex flex-row justify-center">
                <>
                    <div className="relative group items-center">
                        <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={createBank}
                        >
                            <span className="block group-disabled:hidden" >
                                Create Bank
                            </span>
                        </button>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={getBanks}
                        >
                            <span className="block group-disabled:hidden" >
                                Fetch Banks
                            </span>
                        </button>
                    </div>
                </>
            </div>
        </>
    );
};
