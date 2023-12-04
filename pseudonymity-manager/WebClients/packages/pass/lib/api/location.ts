import axios from 'axios'

export const getGeoInfo = async (setLocation: (location: string) => void ) => {
    await axios.get('https://ipapi.co/json/').then((response) => {
        let data = response.data;
        // this.setState({
        //     countryName: data.country_name,
        //     countryCode: data.country_calling_code
        // });
        setLocation(data.country_name);
    }).catch((error) => {
        console.log(error);
    });
};

export const setGeoInfo = (country: string) => {
    axios.get('http:localhost:3000/connect/CA').then((response) => {
        let data = response.data;
        // this.setState({
        //     countryName: data.country_name,
        //     countryCode: data.country_calling_code
        // });
    }).catch((error) => {
        console.log(error);
    });
};