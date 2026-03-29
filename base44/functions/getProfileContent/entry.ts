
Deno.serve(async (req) => {
  console.error("ERROR: This endpoint has been deprecated and its functionality moved. Please use 'functions/profile/getProfileFeed.js' instead.");
  return new Response("This endpoint has been deprecated and is no longer available. Please refer to the updated API documentation.", { status: 410 }); // 410 Gone
});
