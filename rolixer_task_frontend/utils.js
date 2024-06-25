const getAPIRequest = async (query, endPoint) => {
    try {
        const params = {}
        for (const key in query) {
            if (query[key]) {
                params[key] = query[key]
            }
        }
        let url = "http://localhost:8000/api/v1/" + endPoint
        const ext = Object.keys(params).reduce(function (_qs, k) { return _qs + '&' + k + '=' + params[k]; }, '').substring(1);
        url = url + '?' + ext
        const resp = await fetch(url)
        if (resp.status === 200) {
            const data = await resp.json()
            return data
        } else {
            throw new Error(resp?.message || 'Error in fetching data')
        }
    } catch (error) {
        console.log(error, 'error in getData', endPoint)
    }
}


export { getAPIRequest}