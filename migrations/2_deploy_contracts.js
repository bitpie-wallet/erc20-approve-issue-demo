const ExchangeDemo = artifacts.require("ExchangeDemo");
const ExchangeDemoV2 = artifacts.require("ExchangeDemoV2");

module.exports = function(deployer) {
  deployer.deploy(ExchangeDemo);
  deployer.deploy(ExchangeDemoV2);
};
