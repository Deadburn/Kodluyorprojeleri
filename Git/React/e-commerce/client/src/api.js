export const fetchProductList = async() => {
    const res = await fetch("http://localhost:4000/product")
    const data = await res.json()

    console.log(data)
    
    return data
} 