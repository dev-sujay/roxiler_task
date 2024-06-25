import { BiSearchAlt } from "react-icons/bi";

const SearchBar = ({ onChange, value }) => {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <BiSearchAlt className=" text-gray-500 dark:text-gray-400" size={22} />
            </div>
            <input
                id="default-search"
                className="block w-[350px] py-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-while focus:ring-blue-500 focus:border-blue-500 :bg-gray-700 outline-none"
                placeholder="Search Title, Description, price..."
                type="search"
                onChange={onChange}   
                value={value}
            />
        </div>

    )
}

export default SearchBar