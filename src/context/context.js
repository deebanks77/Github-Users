import React, { useState, useEffect, createContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  // request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // error
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    console.log(response);
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      // Repos Url -> (https://api.github.com/users/john-smilga/repos?per_page=100)
      // Followers Url -> (https://api.github.com/users/john-smilga/followers)

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        console.log(results);
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with this username");
    }
    checkRequest();
    setIsLoading(false);
  };

  // check rate
  const checkRequest = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        // console.log(remaining);
        setRequests(remaining);

        if (remaining === 0) {
          toggleError(true, "sorry, you have exhausted your hourly rate limit");
        }
      })
      .catch((err) => console.log(err));
  };

  // check error
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  useEffect(checkRequest, []);

  const data = {
    githubUser,
    repos,
    followers,
    requests,
    isLoading,
    error,
    toggleError,
    searchGithubUser,
  };
  return (
    <GithubContext.Provider value={data}>{children}</GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
