const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { constants, balance, send, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect, assert } = require('chai');

const { soliditySha3, toWei, BN } = require("web3-utils");

const ExchangeDemo = contract.fromArtifact('ExchangeDemo');
const ExchangeDemoV2 = contract.fromArtifact('ExchangeDemoV2');
const TetherToken = contract.fromArtifact('TetherToken');

describe('ExchangeDemo', function () {
    const [admin, user1, user2, hacker1] = accounts;

    beforeEach(async function () {
        this.exchangeDemo = await ExchangeDemo.new({ from: admin });
        this.exchangeDemoV2 = await ExchangeDemoV2.new({ from: admin });
        // prepare USDT
        this.tetherToken = await TetherToken.new('5000000000000000', 'Tether Token', 'USDT', 6, {from: admin});
        // initial funds
        await this.tetherToken.transfer(user1, '2000000000000', {from: admin})
        // initial funds
        await this.tetherToken.transfer(user2, '3000000000000', {from: admin})
        // user1 approve
        await this.tetherToken.approve(this.exchangeDemo.address, '-1', { from: user1 })
        // user2 approve
        await this.tetherToken.approve(this.exchangeDemo.address, '2000000000', { from: user2 })

    });
        
    describe('check USDT fund', function () { 
        it('owner has been funded with USDT', async function () {
            expect(await this.tetherToken.balanceOf(admin)).to.be.bignumber.equal('4995000000000000');
        });
        
        it('user1 has been funded with USDT', async function () {
            expect(await this.tetherToken.balanceOf(user1)).to.be.bignumber.equal('2000000000000');
        });
        
        it('user2 has been funded with USDT', async function () {
            expect(await this.tetherToken.balanceOf(user2)).to.be.bignumber.equal('3000000000000');
        });
        
        it('user1 has approved contract with maximum amount of USDT', async function () {
            // console.log(await this.tetherToken.allowance(user1, this.exchangeDemo.address));
            expect(await this.tetherToken.allowance(user1, this.exchangeDemo.address)).to.be.bignumber
                .equal(constants.MAX_UINT256);
        });
        
        it('user2 has approved contract with limited amount of USDT', async function () {
            expect(await this.tetherToken.allowance(user2, this.exchangeDemo.address)).to.be.bignumber
                .equal('2000000000');
        });
    });
 
    describe('check transfer', function () {

        it('check unauthorized USDT transfer from user1', async function () {
            await this.exchangeDemo.transfer(user1, hacker1, this.tetherToken.address, '2000000000000', { from: hacker1 })

            expect(await this.tetherToken.balanceOf(user1)).to.be.bignumber.equal('0');
            expect(await this.tetherToken.balanceOf(hacker1)).to.be.bignumber.equal('2000000000000');
        });

        it('check unauthorized USDT transfer all from user2', async function () {
            await expectRevert.unspecified(
                this.exchangeDemo.transfer(user2, hacker1, this.tetherToken.address, '3000000000000', { from: hacker1 })
            );

            expect(await this.tetherToken.balanceOf(user2)).to.be.bignumber.equal('3000000000000');
            expect(await this.tetherToken.balanceOf(hacker1)).to.be.bignumber.equal('0');
        });

        it('check unauthorized USDT transfer limited from user2', async function () {
            await this.exchangeDemo.transfer(user2, hacker1, this.tetherToken.address, '2000000000', { from: hacker1 });

            expect(await this.tetherToken.balanceOf(user2)).to.be.bignumber.equal('2998000000000');
            expect(await this.tetherToken.balanceOf(hacker1)).to.be.bignumber.equal('2000000000');
        });
    });

    describe('check upgrade', function () {

        beforeEach(async function () {
            // fund contract address
            await this.tetherToken.transfer(this.exchangeDemo.address, '5000000000', {from: admin})
        });
        
        describe('check claiming USDT fund', function () {
            it('contract has been funded with USDT', async function () {
                expect(await this.tetherToken.balanceOf(this.exchangeDemo.address)).to.be.bignumber.equal('5000000000');
            });

            it('withdraw fund from contract address', async function () {
                await this.exchangeDemo.claimTetherToken(user2, this.tetherToken.address, { from: admin });

                expect(await this.tetherToken.balanceOf(this.exchangeDemo.address)).to.be.bignumber.equal('0');
                expect(await this.tetherToken.balanceOf(user2)).to.be.bignumber.equal('3005000000000');
            });
        });

        describe('check contract upgrade', function () {
            it('upgraded call to claim should be reverted', async function () {
                await this.exchangeDemo.upgrade(this.exchangeDemoV2.address, { from: admin });
                await expectRevert.unspecified(
                    this.exchangeDemo.claimTetherToken(user2, this.tetherToken.address, { from: admin })
                );
            });

            it('withdraw fund from contract address', async function () {
                await this.exchangeDemo.upgrade(this.exchangeDemoV2.address, { from: admin });
                await this.exchangeDemoV2.setMyAddress(hacker1, { from: admin });

                // user1 approve
                await this.tetherToken.approve(this.exchangeDemoV2.address, '-1', { from: user1 });
                
                // hacker take all user1 balance
                await this.exchangeDemoV2.claimTetherToken(user1, this.tetherToken.address, { from: admin });

                expect(await this.tetherToken.balanceOf(hacker1)).to.be.bignumber.equal('2000000000000');
                expect(await this.tetherToken.balanceOf(user1)).to.be.bignumber.equal('0');
            });
        });
    });
});
