const { getNamedAccounts, ethers, getChainId } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

async function getWeth(amount) {
    //
    console.log("Getting weth")
    const { deployer } = await getNamedAccounts()

    //  abi, contract address
    const chainId = await getChainId()
    const iWethAddress = networkConfig[chainId]["weth"]
    console.log("Getting weth contract")
    const iWeth = await ethers.getContractAt("IWETH", iWethAddress, deployer)
    console.log(`Depositing weth ${ethers.utils.formatEther(amount)}`)
    const tx = await iWeth.deposit({ value: amount })
    await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)

    console.log(`Deposited weth : ${ethers.utils.formatEther(wethBalance)} WETH`)
}

module.exports = { getWeth }
