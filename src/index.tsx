import React, { useState } from "react";
import { render } from "react-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  useLazyQuery,
  gql,
} from "@apollo/client";

const client = new ApolloClient({
  uri: "https://71z1g.sse.codesandbox.io/",
  cache: new InMemoryCache(),
});

const GET_DOGS = gql`
  {
    dogs {
      id
      breed
    }
  }
`;

type DogProps = {
  onDogSelected: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

type Dog = {
  id: string;
  breed: string;
};

function Dogs({ onDogSelected }: DogProps): JSX.Element {
  const { loading, error, data } = useQuery(GET_DOGS, {
    // pollInterval: 5000,
    nextFetchPolicy(currentFetchPolicy, { reason, options, observable }) {
      console.log("dogs next fetch", {
        reason,
        currentFetchPolicy,
        options,
        observable,
      });
      return "cache-only";
    },
  });

  if (loading) return <>"Loading..."</>;
  if (error) return <>`Error! ${error.message}`</>;

  return (
    <select name="dog" onChange={onDogSelected}>
      {data.dogs.map((dog: Dog) => (
        <option key={dog.id} value={dog.breed}>
          {dog.breed}
        </option>
      ))}
    </select>
  );
}

const GET_DOG_PHOTO = gql`
  query dog($breed: String!) {
    dog(breed: $breed) {
      id
      displayImage
    }
  }
`;

type DogPhotoProps = {
  breed: string;
};

function DogPhoto({ breed }: DogPhotoProps): JSX.Element {
  const { loading, error, data, refetch, networkStatus } = useQuery(
    GET_DOG_PHOTO,
    {
      variables: { breed },
      errorPolicy: "all",
      fetchPolicy: "cache-first",
      nextFetchPolicy(currentFetchPolicy, { reason, options, observable }) {
        console.log("dog photo next fetch", {
          reason,
          currentFetchPolicy,
          options,
          observable,
        });
        // fetchPolicyと違うものを返すとreason === "variables-changed"にならない
        // return "cache-only";
        if (reason === "variables-changed") {
          console.log(`nextFetchPolicy called with reason "${reason}"`);
          return "cache-only";
        }
        return currentFetchPolicy;
      },
    }
  );

  if (networkStatus === 4) return <p>Refetching!</p>;
  if (loading) return <></>;
  if (error) return <>`Error!: ${error}`</>;

  return (
    <div>
      <div>
        <img src={data.dog.displayImage} style={{ height: 100, width: 100 }} />
      </div>
      <button onClick={() => refetch()}>Refetch!</button>
    </div>
  );
}

function DelayedQuery(): JSX.Element {
  const [getDog, { loading, error, data }] = useLazyQuery(GET_DOG_PHOTO);

  if (loading) return <p>Loading ...</p>;
  if (error) return <>`Error! ${error}`</>;

  return (
    <div>
      {data?.dog && <img src={data.dog.displayImage} />}
      <button onClick={() => getDog({ variables: { breed: "bulldog" } })}>
        Click me!
      </button>
    </div>
  );
}

function App() {
  const [selectedDog, setSelectedDog] = useState("");

  function onDogSelected(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedDog(e.target.value);
  }

  return (
    <ApolloProvider client={client}>
      <div>
        <h2>Building Query components 🚀</h2>
        {selectedDog && <DogPhoto breed={selectedDog} />}
        <Dogs onDogSelected={onDogSelected} />
        <DelayedQuery />
      </div>
    </ApolloProvider>
  );
}

render(<App />, document.getElementById("root"));
