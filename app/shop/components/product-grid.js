import ProductCard from "./product-card";

export default function ProductGrid({ products, cart }) {
  return (
    <div className="product-grid">
      {products.map((product) => <ProductCard key={product.id} product={product} selectedItem={cart.items.find((item) => item.id === product.id)} remaining={cart.remaining} ready={cart.ready} onAdd={cart.add} onRemove={cart.remove} />)}
    </div>
  );
}
