// https://stackoverflow.com/a/2901298
export function commaFormat(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
