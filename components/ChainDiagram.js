// The two halves of the onchain story: what it reads, and how far it goes
// towards writing.
export default function ChainDiagram() {
  return (
    <div className="chain">
      <div className="chain-card">
        <span className="chain-tag">Read</span>
        <code className="chain-sig">function balanceOf(address) view returns (uint256)</code>
        <div className="chain-flow">
          <span className="chain-in">0xA0b8…eB48</span>
          <span className="chain-arrow" />
          <span className="chain-out">4823019400000</span>
        </div>
        <p>
          Paste the line from the contract and it reads it. The number comes back whole, as a
          string, so nothing rounds on the way to the next step.
        </p>
      </div>

      <div className="chain-card">
        <span className="chain-tag">Before you spend</span>
        <div className="chain-sim">
          <div><b>Would succeed</b><span>simulated against the current block</span></div>
          <div><b>0.00042 ETH</b><span>what the fee would be</span></div>
          <div><b>Nothing signed</b><span>no key ever reaches a step</span></div>
        </div>
        <p>
          A step works out what a transaction would do and refuses anything that would fail.
          Signing and sending are yours to do.
        </p>
      </div>
    </div>
  )
}
