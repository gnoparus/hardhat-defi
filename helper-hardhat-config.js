const { network, ethers } = require("hardhat")

const networkConfig = {
    default: {
        name: "hardhat",
        keepersUpdateInterval: "30",
    },
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "8560",
        callbackGasLimit: "500000",
        interval: "30",
        weth: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    },
    31337: {
        name: "localhost",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        callbackGasLimit: "500000",
        interval: "30",
        weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        daiEthPriceFeed: "0x773616E4d11A78F511299002da57A0a94577F1f4",
        lendingPoolAddressesProvider: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = { networkConfig, developmentChains }
