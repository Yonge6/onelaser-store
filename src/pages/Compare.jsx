import { img, machines } from "../lib.js";
import { Link, Price } from "../components/ui.jsx";

export default function Compare() {
  const list = machines.filter((m) => m.series !== "legacy");
  const rows = Object.keys(list[0].specs);
  return (
    <div className="wrap section">
      <nav className="crumbs"><Link to="/">Store</Link> / <span>Compare machines</span></nav>
      <h1 className="h1 center">Find your perfect fit</h1>
      <p className="lead center">Every current OneLaser machine, side by side.</p>
      <div className="compare-scroll">
        <table className="compare">
          <thead>
            <tr>
              <th />
              {list.map((m) => (
                <th key={m.handle}>
                  <Link to={`/products/${m.handle}`}><img src={img(m.images[0], 300)} alt="" loading="lazy" /><b>{m.name}</b></Link>
                  <Price product={m} from />
                  <Link to={`/products/${m.handle}`} className="btn btn-dark btn-sm">Buy Now</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><th>Best for</th>{list.map((m) => <td key={m.handle}>{m.bestFor}</td>)}</tr>
            {rows.map((r) => <tr key={r}><th>{r}</th>{list.map((m) => <td key={m.handle}>{m.specs[r]}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
