// Define colors for different parking areas
function getParkingColor(tags) {
  // https://coolors.co/69b04c-5c9e9c-3f88c5-2a4c79-1f2e53-140f2d-9a937e-f49d37-571654-831d2b
  let paidParkingColor = "#2A4C79";
  let notSureIfFreeParkingColor = "#79B473";
  let freePublicParkingColor = "#69B04C";
  let freeCustomerParkingColor = "#5C9E9C";
  let paidCustomerParkingColor = "#F49D37";
  let permissiveParkingColor = "#F49D37";
  let noParkingColor = "#831D2B";
  let probablyPrivateColor = "#831D2B";
  let notSureColor = "#571654";
  let privateParkingColor = "#9A937E";

  switch (tags.access) {
    case "yes":
      if (tags.fee === "no") {
        return freePublicParkingColor;
      } else if (tags.fee === undefined) {
        return notSureIfFreeParkingColor;
      } else {
        return paidParkingColor;
      }
    case "customers":
      return tags.fee === "yes"
        ? paidCustomerParkingColor
        : freeCustomerParkingColor;
    case "permissive":
      return permissiveParkingColor;
    case "private":
      return privateParkingColor;
    case "residents":
      return noParkingColor;
    case "no":
      return noParkingColor;
    default:
      if (tags.fee === "no") {
        return freePublicParkingColor;
      } else if (tags.fee === undefined) {
        return notSureColor;
      } else if (tags.fee === "yes") {
        return paidParkingColor;
      } else {
        return probablyPrivateColor;
      }
  }
}

function shadeColor(color, percent) {
  // https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors

  var R = parseInt(color.substring(1, 3), 16);
  var G = parseInt(color.substring(3, 5), 16);
  var B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = Math.round(R);
  G = Math.round(G);
  B = Math.round(B);

  var RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
  var GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
  var BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}
