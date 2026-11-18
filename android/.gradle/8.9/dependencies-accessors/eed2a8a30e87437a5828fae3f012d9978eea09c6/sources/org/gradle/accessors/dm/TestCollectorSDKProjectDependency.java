package org.gradle.accessors.dm;

import org.gradle.api.NonNullApi;
import org.gradle.api.artifacts.ProjectDependency;
import org.gradle.api.internal.artifacts.dependencies.ProjectDependencyInternal;
import org.gradle.api.internal.artifacts.DefaultProjectDependencyFactory;
import org.gradle.api.internal.artifacts.dsl.dependencies.ProjectFinder;
import org.gradle.api.internal.catalog.DelegatingProjectDependency;
import org.gradle.api.internal.catalog.TypeSafeProjectDependencyFactory;
import javax.inject.Inject;

@NonNullApi
public class TestCollectorSDKProjectDependency extends DelegatingProjectDependency {

    @Inject
    public TestCollectorSDKProjectDependency(TypeSafeProjectDependencyFactory factory, ProjectDependencyInternal delegate) {
        super(factory, delegate);
    }

    /**
     * Creates a project dependency on the project at path ":collector"
     */
    public CollectorProjectDependency getCollector() { return new CollectorProjectDependency(getFactory(), create(":collector")); }

    /**
     * Creates a project dependency on the project at path ":example"
     */
    public ExampleProjectDependency getExample() { return new ExampleProjectDependency(getFactory(), create(":example")); }

}
