import { GrFormPreviousLink } from "react-icons/gr";
import { GrFormNextLink } from "react-icons/gr";
import { useEffect, useRef, useState } from "react";
import SearchBar from "./components/SearchBar";
import { Button, Card, Select, Table, Tooltip } from "antd";
import moment from "moment";
import { getAPIRequest } from "../utils";
import ReactApexChart from "react-apexcharts";

const App = () => {
  const isFirstRun = useRef(true)
  const [transactions, setTransactions] = useState([])
  const [transcCount, setTranscCount] = useState(0)
  const [stats, setStats] = useState({})
  const [categoryWiseSale, setCategoryWiseSale] = useState([])
  const [priceData, setPriceData] = useState([])
  const [loading, setLoading] = useState(false)
  const monthOpts = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }]

  const [query, setQuery] = useState({
    "pageNumber": 1,
    "pageSize": 10,
    "search": "",
    "month": 3
  })

  const getTransactions = async () => {
    await getAPIRequest(query, 'transactions').then((data) => {
      setTransactions(data?.rows)
      setTranscCount(data?.count)
    }).finally(() => {
      setLoading(false)
    })
  }
  const getStats = async () => {
    await getAPIRequest({
      "month": query.month
    }, 'statistics').then((data) => {
      setStats(data)
    }).finally(() => {
      setLoading(false)
    })
  }
  const getCategoryWiseSale = async () => {
    await getAPIRequest({
      "month": query.month
    }, 'pie-chart').then((data) => {
      setCategoryWiseSale(data)
    }).finally(() => {
      setLoading(false)
    })
  }
  const gerPriceData = async () => {
    await getAPIRequest({
      "month": query.month
    }, 'bar-chart').then((data) => {
      setPriceData(data)
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    if (isFirstRun.current) {
      getTransactions()
      getStats()
      getCategoryWiseSale()
      gerPriceData()
      isFirstRun.current = false
      return
    }

    const time = query.search ? 500 : 0

    const timer = setTimeout(() => {
      getTransactions()
      getStats()
      getCategoryWiseSale()
      gerPriceData()
    }, time)

    return () => clearTimeout(timer)
  }, [query])

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title) => (
        <Tooltip title={title}>
          {title.length > 15 ? title.slice(0, 15) + '...' : title}
        </Tooltip>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => (
        <Tooltip title={desc}>
          {desc.length > 15 ? desc.slice(0, 20) + '...' : desc}
        </Tooltip>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span>₹ {price?.toFixed(2)}</span>
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Sold',
      dataIndex: 'dateOfSale',
      key: 'dateOfSale',
      render: (date) => <span>{
        moment(date).format('DD-MM-YYYY')
      }</span>
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (url) => <img src={url || 'https://via.placeholder.com/150'} alt="img" className="w-10 h-10 object-cover rounded-full" />
    }
  ];



  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold mb-8">Transaction Dashboard</h1>
      <div className="flex items-center justify-between mb-4 w-full max-w-screen-xl">
        <SearchBar
          value={query.search}
          onChange={(e) => setQuery({ ...query, search: e.target.value })}
        />
        <Select
          className="w-40"
          defaultValue={monthOpts?.find((item) => item.value === query.month)?.label}
          options={monthOpts}
          value={query.month}
          onChange={(val) => setQuery({ ...query, month: val })}
        />
      </div>
      <div className=" w-full max-w-screen-xl">
        <Table dataSource={transactions} columns={columns} pagination={false} loading={loading} />
      </div>
      <div className="flex justify-between w-full max-w-screen-xl mt-4">
        <span>Page No: {
          query.pageNumber
        }</span>
        <div className="flex space-x-2">
          <Button
            disabled={query.pageNumber === 1}
            onClick={() => {
              setQuery({ ...query, pageNumber: query.pageNumber - 1 })
            }}>
            <GrFormPreviousLink /> Prev
          </Button>
          <Button
            disabled={query.pageNumber * query.pageSize >= transcCount}
            onClick={() => {
              setQuery({ ...query, pageNumber: query.pageNumber + 1 })
            }} >
            Next <GrFormNextLink />
          </Button>
        </div>
        <div>
          <span>Per Page : </span>
          <Select
            className="mx-2"
            defaultValue={query.pageSize}
            onChange={(val) => setQuery({ ...query, pageSize: val })}
            options={[10, 20, 30, 40, 50].map((val) => ({ label: val, value: val }))}
          />
        </div>
      </div>
      <div className="flex justify-between w-full max-w-screen-xl mt-8">
        <Card className="w-1/2 mt-8 text-xl" title="Statistics">
          Total Sales : ₹ {stats?.totalSaleAmount} <br />
          Total Sold Items : {stats?.totalSoldItems} <br />
          Total Not Sold Items : {stats?.totalNotSoldItems} <br />
        </Card>

        <Card className="w-1/2 mt-8" title="Category Wise Pie-Chart">
          <ReactApexChart
            options={{
              labels: categoryWiseSale?.map((item) => item._id),
              legend: {
                position: 'bottom'
              }
            }}
            series={categoryWiseSale?.map((item) => item.count)}
            type="donut"
            height={200}
          />
        </Card>
      </div>
      <div className="w-full max-w-screen-xl mt-8">
        <ReactApexChart
          options={{
              chart: {
                type: 'bar',
                height: 350
              },
              plotOptions: {
                bar: {
                  horizontal: false,
                  columnWidth: '55%',
                  endingShape: 'rounded'
                },
              },
              dataLabels: {
                enabled: true
              },
              xaxis: {
                categories: priceData?.map((item) => item?.range),
              },
              yaxis: {
                title: {
                  text: 'No of Items Sold'
                }
              },
              fill: {
                opacity: 1
              }
            }
          }
          series={[{
              name: 'Count',
              data: priceData?.map((item) => item?.count)
            }]}
          type="bar"
          height={300}
        />
      </div>
    </div>
  );
};

export default App;
