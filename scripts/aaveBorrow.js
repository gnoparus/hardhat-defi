const { getWeth } = require("./getWeth")
const { getNamedAccounts, ethers, getChainId, network } = require("hardhat")
const ILendingPoolAddressesProviderArtifact = require("@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json")
const ILendingPoolArtifact = require("@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json")
const { networkConfig } = require("../helper-hardhat-config")
const AggregatorV3Interface = require("@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json")

const AMOUNT = ethers.utils.parseEther("1.0")

async function getLendingPool(account) {
    const chainId = await getChainId()
    //
    // const lendingPoolAddressesProvider = await ethers.getContractAt(
    //     "LendingPoolAddressesProvider",
    //     "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    //     account
    // )
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        ILendingPoolAddressesProviderArtifact.abi,
        networkConfig[chainId]["lendingPoolAddressesProvider"],
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    // const lendingPool = await ethers.getContractAt("LendingPool", lendingPoolAddress, account)
    const lendingPool = await ethers.getContractAt(ILendingPoolArtifact.abi, lendingPoolAddress, account)
    return lendingPool
}

async function getDaiPrice() {
    const chainId = await getChainId()
    //
    const priceFeed = await ethers.getContractAt(AggregatorV3Interface, networkConfig[chainId]["daiEthPriceFeed"])
    const { roundId, answer, startedAt, updatedAt, answeredInRound } = await priceFeed.latestRoundData()
    console.log(`answer : ${ethers.utils.formatEther(answer)}`)
    return answer
}

async function getBorrowedUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH, currentLiquidationThreshold, ltv, healthFactor } =
        await lendingPool.getUserAccountData(account)

    console.log(`totalCollateralETH : ${ethers.utils.formatEther(totalCollateralETH)}`)
    console.log(`totalDebtETH : ${ethers.utils.formatEther(totalDebtETH)}`)
    console.log(`availableBorrowsETH : ${ethers.utils.formatEther(availableBorrowsETH)}`)
    console.log(`currentLiquidationThreshold : ${currentLiquidationThreshold}`)
    console.log(`ltv : ${ltv}`)
    console.log(`healthFactor : ${healthFactor}`)

    return { availableBorrowsETH, totalDebtETH }
}

async function approveErc20(contractAddress, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", contractAddress, account)
    const txResponse = await erc20Token.approve(spenderAddress, amountToSpend)
    await txResponse.wait(1)
    console.log(`Approved erc20`)
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
    //
    console.log("Borrowing...")
    //  interestRateMode The interest rate mode at which the user wants to borrow: 1 for Stable, 2 for Variable
    const interestRateMode = 1
    const referralCode = 0
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, interestRateMode, referralCode, account)
    borrowTx.wait(1)
    console.log("Borrowed")
}

async function repay(daiAddress, amount, lendingPool, account) {
    console.log("Repaying...")
    const interestRateMode = 1
    const repayTx = await lendingPool.repay(daiAddress, amount, interestRateMode, account)
    repayTx.wait(1)
    console.log("Repay already")
}

async function main() {
    const chainId = await getChainId()

    // Get weth from weth gateway using eth
    await getWeth(AMOUNT)
    const { deployer } = await getNamedAccounts()

    // Get AAVE LendingPool using abi, address
    const lendingPool = await getLendingPool(deployer)
    console.log(`lendingPool : ${lendingPool.address}`)

    // Deposit
    const wethTokenAddress = networkConfig[chainId]["weth"]
    console.log(`wethTokenAddress : ${wethTokenAddress}`)

    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)

    console.log(`Depositing...`)
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log(`Deposited`)

    // Borrow
    // Check how much borrowed, collateral, available
    let { availableBorrowsETH, totalDebtETH } = await getBorrowedUserData(lendingPool, deployer)

    // Convert availableBorrowsETH to DAI using exchange rate from chainlink's pricefeed
    const daiPrice = await getDaiPrice(deployer)
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`amountDaiToBorrow : ${amountDaiToBorrow}`)
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`amountDaiToBorrowWei : ${amountDaiToBorrowWei}`)

    const daiAddress = networkConfig[chainId]["dai"]
    await borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, deployer)

    await getBorrowedUserData(lendingPool, deployer)

    // Repay
    await approveErc20(daiAddress, lendingPool.address, amountDaiToBorrowWei, deployer)
    await repay(daiAddress, amountDaiToBorrowWei, lendingPool, deployer)
    await getBorrowedUserData(lendingPool, deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
