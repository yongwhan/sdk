import { BigNumber } from "ethers";
import { DepositWithBlock, FillWithBlock, UbaFlow } from "../../interfaces";
import { UBAActionType } from "../../UBAFeeCalculator/UBAFeeTypes";

// @todo: Revert to this after bumping typescript: { valid: true, fill: FillWithBlock } | { valid: false, reason: string } ;
export type RequestValidReturnType = {
  valid: boolean;
  reason?: string;
  matchingFill?: FillWithBlock;
  matchingDeposit?: DepositWithBlock;
};
export type BalancingFeeReturnType = { balancingFee: BigNumber; actionType: UBAActionType };
export type SystemFeeResult = { lpFee: BigNumber; depositBalancingFee: BigNumber; systemFee: BigNumber };
export type RelayerFeeResult = {
  relayerBalancingFee: BigNumber;
};

export type ModifiedUBAFlow = {
  flow: UbaFlow;
  balancingFee: BigNumber;
  lpFee: BigNumber;
  runningBalance: BigNumber;
  incentiveBalance: BigNumber;
  netRunningBalanceAdjustment: BigNumber;
};

export type UBAClientState = {
  [chainId: number]: UBABundleTokenState;
};

export type UBABundleTokenState = {
  [tokenSymbol: string]: UBABundleState[];
};

export type UBABundleState = {
  bundleBlockRanges: number[][];
  flows: ModifiedUBAFlow[];
};

export type SpokePoolFillFilter = {
  relayer?: string;
  fromBlock?: number;
  toBlock?: number;
  repaymentChainId?: number;
  isSlowRelay?: boolean;
  isCompleteFill?: boolean;
};
